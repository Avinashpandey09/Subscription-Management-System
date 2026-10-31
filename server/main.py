from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config.db import Base, engine
from models import user  

app = FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"], 
    allow_headers=["*"],
)


 
Base.metadata.create_all(bind=engine)


@app.get("/")
def read_root():
    return {"message": "Hello World"} 
 