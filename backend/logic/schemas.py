from pydantic import BaseModel
from typing import Optional, List, Literal

class AlgoConfig(BaseModel):
    key_size: int
    mode: Optional[str] = None
    padding: Optional[str] = None
    implementation: Optional[Literal["our", "library"]] = "our"

class RaceConfig(BaseModel):
    aes: AlgoConfig
    rsa: AlgoConfig

class StartRaceCommand(BaseModel):
    command: str
    session_id: str
    file_ids: List[str]
    config: RaceConfig