import requests
from tqdm.auto import tqdm

def download_file(link, file_name):
    response = requests.get(link, stream=True)
    with tqdm.wrapattr(open(file_name, "wb"), "write", miniters=1,
                    total=int(response.headers.get('content-length', 0)),
                    desc=file_name) as fout:
                    
        for chunk in response.iter_content(chunk_size=4096):
            fout.write(chunk)