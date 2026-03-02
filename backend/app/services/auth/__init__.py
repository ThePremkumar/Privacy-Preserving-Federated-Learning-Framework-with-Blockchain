"""
Authentication and authorization module for federated learning
"""

from .auth_service import (
    AuthenticationService, 
    RBACMiddleware, 
    User, 
    Hospital, 
    UserRole, 
    Permission,
    create_auth_dependency,
    create_permission_dependency
)

__all__ = [
    'AuthenticationService',
    'RBACMiddleware',
    'User',
    'Hospital',
    'UserRole',
    'Permission',
    'create_auth_dependency',
    'create_permission_dependency'
]
