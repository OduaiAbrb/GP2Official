"""Input validation and sanitization utilities."""

import re
import html
import bleach
from typing import Any, Dict, List, Optional, Union
from pydantic import BaseModel, Field, validator
from fastapi import HTTPException


class ValidationError(Exception):
    """Custom validation error."""
    pass


def sanitize_html(content: str, allowed_tags: List[str] = None) -> str:
    """Sanitize HTML content to prevent XSS attacks."""
    if not content:
        return ""
    
    # Default allowed tags for rich text content
    if allowed_tags is None:
        allowed_tags = [
            'p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li', 
            'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote',
            'code', 'pre', 'a'
        ]
    
    allowed_attributes = {
        'a': ['href', 'title'],
        'code': ['class'],
        'pre': ['class']
    }
    
    return bleach.clean(
        content, 
        tags=allowed_tags, 
        attributes=allowed_attributes,
        strip=True
    )


def sanitize_plain_text(content: str, max_length: int = None) -> str:
    """Sanitize plain text content."""
    if not content:
        return ""
    
    # Remove HTML tags and decode HTML entities
    cleaned = html.escape(content.strip())
    
    # Remove control characters except newlines and tabs
    cleaned = re.sub(r'[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]', '', cleaned)
    
    if max_length and len(cleaned) > max_length:
        cleaned = cleaned[:max_length]
    
    return cleaned


def validate_email(email: str) -> bool:
    """Validate email format."""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))


def validate_password_strength(password: str) -> Dict[str, Union[bool, str]]:
    """Validate password strength and return detailed feedback."""
    result = {
        "is_valid": True,
        "errors": []
    }
    
    if len(password) < 8:
        result["errors"].append("Password must be at least 8 characters long")
    
    if not re.search(r'[A-Z]', password):
        result["errors"].append("Password must contain at least one uppercase letter")
    
    if not re.search(r'[a-z]', password):
        result["errors"].append("Password must contain at least one lowercase letter")
    
    if not re.search(r'\d', password):
        result["errors"].append("Password must contain at least one digit")
    
    if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        result["errors"].append("Password must contain at least one special character")
    
    # Check for common weak passwords
    weak_patterns = ['password', '123456', 'qwerty', 'abc123']
    if password.lower() in weak_patterns:
        result["errors"].append("Password is too common")
    
    result["is_valid"] = len(result["errors"]) == 0
    return result


def validate_project_name(name: str) -> str:
    """Validate and sanitize project name."""
    if not name or not name.strip():
        raise ValidationError("Project name cannot be empty")
    
    sanitized = sanitize_plain_text(name, max_length=255)
    
    if len(sanitized) < 3:
        raise ValidationError("Project name must be at least 3 characters long")
    
    # Check for valid characters (letters, numbers, spaces, hyphens, underscores)
    if not re.match(r'^[a-zA-Z0-9\s\-_]+$', sanitized):
        raise ValidationError("Project name contains invalid characters")
    
    return sanitized


def validate_organization_name(name: str) -> str:
    """Validate and sanitize organization name."""
    if not name or not name.strip():
        raise ValidationError("Organization name cannot be empty")
    
    sanitized = sanitize_plain_text(name, max_length=255)
    
    if len(sanitized) < 2:
        raise ValidationError("Organization name must be at least 2 characters long")
    
    return sanitized


def validate_user_input(data: Dict[str, Any]) -> Dict[str, Any]:
    """Validate and sanitize user input data."""
    sanitized = {}
    
    for key, value in data.items():
        if isinstance(value, str):
            # Sanitize string values based on field type
            if key.endswith('_html') or key in ['description', 'content', 'notes']:
                sanitized[key] = sanitize_html(value)
            elif key == 'email':
                email_val = sanitize_plain_text(value, max_length=255)
                if not validate_email(email_val):
                    raise ValidationError(f"Invalid email format: {email_val}")
                sanitized[key] = email_val
            elif key in ['name', 'title', 'full_name']:
                sanitized[key] = sanitize_plain_text(value, max_length=255)
            else:
                sanitized[key] = sanitize_plain_text(value, max_length=1000)
        elif isinstance(value, dict):
            sanitized[key] = validate_user_input(value)
        elif isinstance(value, list):
            sanitized[key] = [
                validate_user_input(item) if isinstance(item, dict) else 
                sanitize_plain_text(str(item)) if isinstance(item, str) else item
                for item in value
            ]
        else:
            sanitized[key] = value
    
    return sanitized


def validate_file_upload(filename: str, content: bytes, max_size_mb: int = 10) -> None:
    """Validate file upload."""
    if not filename or not filename.strip():
        raise ValidationError("Filename cannot be empty")
    
    # Check file size
    size_mb = len(content) / (1024 * 1024)
    if size_mb > max_size_mb:
        raise ValidationError(f"File size ({size_mb:.1f}MB) exceeds maximum allowed size ({max_size_mb}MB)")
    
    # Check file extension
    allowed_extensions = {
        '.txt', '.md', '.json', '.csv', '.xml', '.yaml', '.yml',
        '.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp',
        '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'
    }
    
    file_extension = filename.lower().split('.')[-1] if '.' in filename else ''
    if f'.{file_extension}' not in allowed_extensions:
        raise ValidationError(f"File type .{file_extension} is not allowed")
    
    # Sanitize filename
    safe_chars = re.sub(r'[^a-zA-Z0-9\-_\.]', '_', filename)
    if safe_chars != filename:
        raise ValidationError("Filename contains invalid characters")


class ValidatedBaseModel(BaseModel):
    """Base model with input validation."""
    
    def __init__(self, **data):
        # Sanitize input data before validation
        if data:
            data = validate_user_input(data)
        super().__init__(**data)


def sanitize_sql_identifier(identifier: str) -> str:
    """Sanitize SQL identifiers to prevent injection."""
    if not identifier:
        raise ValidationError("SQL identifier cannot be empty")
    
    # Only allow alphanumeric characters and underscores
    if not re.match(r'^[a-zA-Z_][a-zA-Z0-9_]*$', identifier):
        raise ValidationError("Invalid SQL identifier format")
    
    # Check against reserved keywords
    reserved_keywords = {
        'select', 'insert', 'update', 'delete', 'drop', 'create', 'alter',
        'table', 'database', 'index', 'view', 'trigger', 'procedure', 'function'
    }
    
    if identifier.lower() in reserved_keywords:
        raise ValidationError(f"'{identifier}' is a reserved SQL keyword")
    
    return identifier


def validate_json_data(data: Any, max_depth: int = 10, current_depth: int = 0) -> Any:
    """Validate JSON data structure to prevent deeply nested attacks."""
    if current_depth > max_depth:
        raise ValidationError("JSON data structure is too deeply nested")
    
    if isinstance(data, dict):
        if len(data) > 1000:  # Limit number of keys
            raise ValidationError("JSON object has too many keys")
        
        validated = {}
        for key, value in data.items():
            if not isinstance(key, str):
                raise ValidationError("JSON keys must be strings")
            
            if len(key) > 255:
                raise ValidationError("JSON key is too long")
            
            validated[sanitize_plain_text(key)] = validate_json_data(
                value, max_depth, current_depth + 1
            )
        return validated
    
    elif isinstance(data, list):
        if len(data) > 1000:  # Limit array size
            raise ValidationError("JSON array is too large")
        
        return [validate_json_data(item, max_depth, current_depth + 1) for item in data]
    
    elif isinstance(data, str):
        if len(data) > 10000:  # Limit string length
            raise ValidationError("JSON string value is too long")
        return sanitize_plain_text(data)
    
    elif isinstance(data, (int, float, bool, type(None))):
        return data
    
    else:
        raise ValidationError(f"Unsupported JSON data type: {type(data)}")
