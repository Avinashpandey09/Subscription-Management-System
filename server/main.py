import os



from config.db import Base, engine, ensure_user_timestamps, normalize_user_role_enum
from models import password_reset, product, user  # noqa: F401 — register tables for create_all
from routes import admin, auth, catalog

app = FastAPI(title="Subscription Management API")

app.add_middleware(
    CORSMiddleware,

    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def http_error_response(status_code: int, message: object) -> JSONResponse:
    return JSONResponse(status_code=status_code, content={"message": message})


def validation_error_response(errors: list) -> JSONResponse:
    issues = [
        {
            "field": ".".join(str(part) for part in error["loc"][1:]) or "body",
            "message": error["msg"],
        }
        for error in errors
    ]
    return JSONResponse(
        status_code=422, content={"message": "Validation failed", "issues": issues}
    )


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(_request: Request, exc: StarletteHTTPException):
    return http_error_response(exc.status_code, exc.detail)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(_request: Request, exc: RequestValidationError):
    return validation_error_response(exc.errors())


normalize_user_role_enum()
Base.metadata.create_all(bind=engine)
ensure_user_timestamps()

app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(catalog.router)


@app.get("/")
def read_root():
    return {"message": "Hello World"}


@app.get("/api/health")
def health():
    return {"status": "ok"}
