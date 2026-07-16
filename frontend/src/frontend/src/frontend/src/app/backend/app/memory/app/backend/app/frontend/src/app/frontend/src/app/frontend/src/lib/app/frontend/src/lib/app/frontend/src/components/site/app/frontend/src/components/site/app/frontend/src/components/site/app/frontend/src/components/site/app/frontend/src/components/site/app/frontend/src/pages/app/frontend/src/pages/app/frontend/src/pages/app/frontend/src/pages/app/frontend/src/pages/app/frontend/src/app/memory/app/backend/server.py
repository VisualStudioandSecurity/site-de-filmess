class AdsConfig(BaseModel):
    header_html: str = \"\"
    sidebar_html: str = \"\"
    in_content_html: str = \"\"
    pre_player_html: str = \"\"
    popunder_html: str = \"\"
    popunder_delay_seconds: int = 5
