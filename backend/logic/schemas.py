from pydantic import BaseModel
from typing import Optional, List

class AlgoConfig(BaseModel):
    key_size: int
    mode: Optional[str] = None
    padding: Optional[str] = None

class RaceConfig(BaseModel):
    aes: AlgoConfig
    rsa: AlgoConfig

class StartRaceCommand(BaseModel):
    command: str
    session_id: str
    file_ids: List[str]
    config: RaceConfig