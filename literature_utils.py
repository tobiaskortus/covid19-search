import json

class DataLoader:
    def __init__(self, path):
       with open(path) as f:
            self.json = json.load(f)


    def get_full_text(self):
        return f"{self.get_title()} {self.get_text('abstract')} {self.get_text('body_text')}"

    def get_text(self, txt_type='body_text'):
        concat_text = ''

        for block in self.json[txt_type]:
            concat_text += block['text'].lower()

        return concat_text

    def get_title(self):
        return self.json['metadata']['title']
