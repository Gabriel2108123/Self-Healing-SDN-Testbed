def success_response(message="Success", data=None):
    """
    Standardize successful API responses.
    """
    resp = {
        "status": "success",
        "message": message
    }
    if data is not None:
        resp["data"] = data
    return resp

def error_response(message="An error occurred", status_code=400):
    """
    Standardize error API responses.
    Returns a tuple of (dict, int) compatible with Flask.
    """
    return {
        "status": "error",
        "message": message
    }, status_code
