from pydantic import BaseModel

class User(BaseModel):
    id: int
    name: str

def test_pydantic():
    user = User(id=1, name="Test")
    assert user.id == 1
    assert user.name == "Test"
