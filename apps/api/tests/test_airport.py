async def test_create_and_get_airport(client):
    payload = {"iata": "ABV", "icao": "DNAA", "name": "Nnamdi Azikiwe", "timezone": "Africa/Lagos"}
    r = await client.post("/airports", json=payload)
    assert r.status_code in (200, 201)
    airport_id = r.json()["id"]

    r = await client.get(f"/airports/{airport_id}")
    assert r.json()["iata"] == "ABV"


async def test_get_missing_airport_is_404(client):
    r = await client.get("/airports/999999")
    assert r.status_code == 404