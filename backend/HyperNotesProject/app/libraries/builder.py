class Build:
    def build(self, scheme: str, domain_name: str, path: str, keys: dict) -> str:
        canonical_url = f"{scheme}://{domain_name}{path}"
        query_string = "&".join(f"{k}={v}" for k, v in keys.items() if k == "query")
        fragment_string = "&".join(f"{k}={v}" for k, v in keys.items() if k == "fragments")
        if query_string:
            canonical_url += f"?{query_string}"
        if fragment_string:
            canonical_url += f"#{fragment_string}"
        return canonical_url