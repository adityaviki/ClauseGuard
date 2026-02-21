from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}

    anthropic_api_key: str = ""
    elasticsearch_url: str = "http://localhost:9200"
    embedding_model: str = "all-MiniLM-L6-v2"
    es_contracts_index: str = "clauseguard-contracts"
    es_clauses_index: str = "clauseguard-clauses"
    claude_model: str = "claude-sonnet-4-20250514"


settings = Settings()
