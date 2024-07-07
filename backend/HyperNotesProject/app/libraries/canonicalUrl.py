from urllib.parse import urlparse
from .builder import Build
from ..models import Domain, DomainConfiguration
import re

class CanonicalUrl:
    def __init__(self, url: str) -> None:
        self.url = url
        self.build_instance = Build()
    def get(self) -> tuple[int, str]:
        url = self.url
        parsed_url = urlparse(url)
        domain_name = parsed_url.netloc
        path_name = parsed_url.path
        url_scheme = parsed_url.scheme
        
        try:
            domain_model_instance = Domain.objects.get(domainName=domain_name)
        except Domain.DoesNotExist:
            return 404, "Domain does not exist"
        
        if domain_model_instance.status == "blocked":
            return 403, "Domain is blocked"
        elif domain_model_instance.status == "allowed":
            try:
                domain_config = DomainConfiguration.objects.get(domainID=domain_model_instance.domainID, path=path_name)
                regex_pattern = domain_config.path
                if re.match(regex_pattern, path_name):
                    keys = domain_config.keys
                    canonical_url = self.build_instance.build(url_scheme, domain_name, path_name, keys)
                    return 200, canonical_url
                else:
                    return 404, "Path not found"
            except DomainConfiguration.DoesNotExist:
                return 404, "Domain configuration does not exist"
        else:
            return 400, "Invalid domain status"