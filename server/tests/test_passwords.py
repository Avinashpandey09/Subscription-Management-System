from utils.security import hash_password, password_issues, verify_password


def test_strong_password_has_no_issues():
    assert password_issues("Demo@1234") == []


def test_short_password_rejected():
    assert any("8 characters" in issue for issue in password_issues("Ab@1"))


def test_missing_character_classes_rejected():
    assert any("uppercase" in issue for issue in password_issues("demo@1234"))
    assert any("lowercase" in issue for issue in password_issues("DEMO@1234"))
    assert any("special" in issue for issue in password_issues("Demo1234"))


def test_overlong_password_rejected():
    assert password_issues("Aa@" + "x" * 70) != []


def test_hash_and_verify_roundtrip():
    hashed = hash_password("Demo@1234")
    assert hashed != "Demo@1234"
    assert verify_password("Demo@1234", hashed)
    assert not verify_password("Wrong@1234", hashed)
