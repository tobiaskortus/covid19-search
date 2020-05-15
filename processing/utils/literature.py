import json
import pycld2 as cld2

class DataLoader:
    def __init__(self, path):
       with open(path) as f:
            self.json = json.load(f)


    def get_full_text(self):
        return f"{self.get_title()} {self.get_text('abstract')} {self.get_text('body_text')}"

    def get_text(self, txt_type='body_text'):
        concat_text = ''

        for block in self.json[txt_type]:
            concat_text += block['text']

        return concat_text

    def get_title(self):
        return self.json['metadata']['title']


def get_full_text(fpath, dl=None):
    if dl is None: dl = DataLoader(fpath)
    return dl.get_full_text()

def get_abstract(fpath, dl=None):
    if dl is None: dl = DataLoader(fpath)
    return dl.get_text(txt_type='abstract')

def get_body_text(fpath, dl=None):
    if dl is None: dl = DataLoader(fpath)
    return dl.get_text(txt_type='body_text')

def get_document_title(fpath, dl=None):
    if dl is None: dl = DataLoader(fpath)
    return dl.get_title()

def is_english(text):
    is_reliable, _, details = cld2.detect(text)
    if not is_reliable or details[0][1] != 'en':
        return False
    return True

def get_section(fpath, section, dl=None):
    if dl is None: dl = DataLoader(fpath)
    text = ''
    if section == 'title':
        text = get_document_title(fpath, dl=dl)
    elif section == 'abstract':
        text = get_abstract(fpath, dl=dl)
    else:
        text = get_body_text(fpath, dl=dl)
            
    return text

def get_sections():
    return {
        'title': 0,
        'abstract': 1,
        'body_text': 2 }