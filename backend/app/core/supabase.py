"""
Supabase Client
"""
from supabase import create_client, Client
from app.core.config import settings


def get_supabase_client() -> Client:
    """Get Supabase client instance"""
    return create_client(
        settings.SUPABASE_URL,
        settings.SUPABASE_SERVICE_ROLE_KEY  # Service role for backend
    )


# Global client instance
supabase: Client = get_supabase_client()

