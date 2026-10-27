from datetime import datetime, timezone


async def _make_reference_data(client):
    """Fulfil the foreign keys a flight needs: airline, type, aircraft, airports."""
    airline = (await client.post("/airlines", json={"iata": "ZA", "name": "Zenith Air"})).json()
    aircraft_type = (
        await client.post(
            "/aircraft-types",
            json={"icao_code": "B738", "size": "D", "seats": 162, "typical_turn_min": 45},
        )
    ).json()
    aircraft = (
        await client.post(
            "/aircraft",
            json={
                "registration": "5N-ZAA",
                "airline_id": airline["id"],
                "type_id": aircraft_type["id"],
            },
        )
    ).json()
    origin = (
        await client.post(
            "/airports",
            json={"iata": "ABV", "icao": "DNAA", "name": "Abuja", "timezone": "Africa/Lagos"},
        )
    ).json()
    dest = (
        await client.post(
            "/airports",
            json={"iata": "LOS", "icao": "DNMM", "name": "Lagos", "timezone": "Africa/Lagos"},
        )
    ).json()
    return airline, aircraft_type, aircraft, origin, dest


async def _create_flight(client, *, aircraft_id, airline_id, origin_id, dest_id):
    return (
        await client.post(
            "/flights",
            json={
                "airline_id": airline_id,
                "origin_id": origin_id,
                "dest_id": dest_id,
                "flight_no": "ZA100",
                "direction": "DEP",
                "sched_time": datetime.now(timezone.utc).isoformat(),
                "status": "scheduled",
                "aircraft_id": aircraft_id,
            },
        )
    ).json()


async def test_airline_update_and_delete(client):
    created = (await client.post("/airlines", json={"iata": "ZA", "name": "Zenith"})).json()

    updated = await client.put(
        f"/airlines/{created['id']}", json={"name": "Zenith Air"}
    )
    assert updated.status_code == 200
    assert updated.json()["name"] == "Zenith Air"

    assert (await client.delete(f"/airlines/{created['id']}")).status_code == 204
    assert (await client.get(f"/airlines/{created['id']}")).status_code == 404


async def test_airport_update_and_delete(client):
    created = (
        await client.post(
            "/airports",
            json={"iata": "KAN", "icao": "DNKN", "name": "Kano", "timezone": "Africa/Lagos"},
        )
    ).json()

    updated = await client.put(f"/airports/{created['id']}", json={"name": "Mallam Aminu Kano"})
    assert updated.status_code == 200
    assert updated.json()["name"] == "Mallam Aminu Kano"

    assert (await client.delete(f"/airports/{created['id']}")).status_code == 204


async def test_aircraft_type_and_aircraft_crud(client):
    airline, aircraft_type, aircraft, _, _ = await _make_reference_data(client)

    assert (await client.put(f"/aircraft-types/{aircraft_type['id']}", json={"seats": 180})).json()[
        "seats"
    ] == 180
    assert (await client.put(f"/aircraft/{aircraft['id']}", json={"registration": "5N-ZAB"})).json()[
        "registration"
    ] == "5N-ZAB"

    assert (await client.delete(f"/aircraft/{aircraft['id']}")).status_code == 204
    assert (await client.delete(f"/aircraft-types/{aircraft_type['id']}")).status_code == 204
    assert (await client.delete(f"/airlines/{airline['id']}")).status_code == 204


async def test_flight_create_materialises_rotation_and_cleanup(client):
    airline, _, aircraft, origin, dest = await _make_reference_data(client)
    flight = await _create_flight(
        client,
        aircraft_id=aircraft["id"],
        airline_id=airline["id"],
        origin_id=origin["id"],
        dest_id=dest["id"],
    )
    # A rotation was created automatically from the aircraft.
    assert flight["rotation_id"] is not None

    updated = await client.put(f"/flights/{flight['id']}", json={"status": "delayed"})
    assert updated.status_code == 200
    assert updated.json()["status"] == "delayed"
    assert updated.json()["version"] == 2

    assert (await client.delete(f"/flights/{flight['id']}")).status_code == 204


async def test_airport_search_and_pagination(client):
    for iata, icao, name in [
        ("PHC", "DNPO", "Port Harcourt"),
        ("KAN", "DNKN", "Kano"),
        ("ENU", "DNEN", "Enugu"),
    ]:
        await client.post(
            "/airports",
            json={"iata": iata, "icao": icao, "name": name, "timezone": "Africa/Lagos"},
        )

    r = await client.get("/airports", params={"search": "Harcourt"})
    assert r.status_code == 200
    assert any(a["iata"] == "PHC" for a in r.json())

    count = await client.get("/airports/count")
    assert count.status_code == 200
    assert count.json()["total"] >= 3

    first = (await client.get("/airports", params={"offset": 0, "limit": 1})).json()
    second = (await client.get("/airports", params={"offset": 1, "limit": 1})).json()
    assert len(first) == 1 and len(second) == 1
    assert first[0]["iata"] != second[0]["iata"]
