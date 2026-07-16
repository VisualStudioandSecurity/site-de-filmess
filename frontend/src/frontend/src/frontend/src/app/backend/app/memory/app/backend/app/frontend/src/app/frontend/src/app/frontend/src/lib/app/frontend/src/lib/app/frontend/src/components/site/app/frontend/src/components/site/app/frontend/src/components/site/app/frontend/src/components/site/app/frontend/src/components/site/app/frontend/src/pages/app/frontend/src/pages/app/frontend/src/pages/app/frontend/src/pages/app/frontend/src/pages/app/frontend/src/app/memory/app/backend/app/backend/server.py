    cfg = await db.ads_config.find_one({\"id\": \"singleton\"}, {\"_id\": 0}) or {
        \"id\": \"singleton\",
        \"header_html\": \"\",
        \"sidebar_html\": \"\",
        \"in_content_html\": \"\",
        \"pre_player_html\": \"\",
        \"popunder_html\": \"\",
        \"popunder_delay_seconds\": 5,
    }
    return cfg
