import json
from zipfile import ZipFile
import pycld2 as cld2
from os import getcwd, pardir, environ
from os import listdir, mkdir
from os.path import isfile, join
from glob import glob
from .grid.grid import GridLookup
from os.path import isdir, isfile

class DataLoader:
    def __init__(self, path, grid_lookup=None):
        self.grid_lookup = grid_lookup if grid_lookup != None else GridLookup()
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

    #TODO: Improve is name check
    def __is_name(self, first_name, middle_name, last_name):
        return not len(last_name) < 2 or first_name.isalpha() or first_name is ' ' or first_name is ''

    def __clean_name_part(self, x):
        """
        removes error in names (e.g ; Name or Name§, etc.)
        """
        return''.join(ch for ch in x if ch.isalpha() or ch is '-')

    def __join_name(self, name, normalize_names=False):
        first_name, middle_names, last_name = name
        
        #Normalize name to following form #.#.#### (eg. Stephen William Hawking -> S. W. Hawking)
        if normalize_names:
            first_name = f'{first_name[0].upper()}. '
            middle_names = [f'{middle_name[0].upper()}. ' for middle_name in middle_names if len(middle_name) != 0]

        return f"{first_name}{''.join(middle_names)}{last_name}"

    def __parse_author(self, raw_author, clean_names=False, normalize_names=False, plausibility_check=False):
        if clean_names:
            middle_names = [self.__clean_name_part(name) for name in raw_author['middle']]
            first_name = f"{self.__clean_name_part(raw_author['first'])} "
            last_name = self.__clean_name_part(raw_author['last'])
        else:
            first_name = f"{raw_author['first']} "
            middle_names = [name for name in raw_author['middle']]
            last_name = raw_author['last']

        is_name = True
        if plausibility_check:
            is_name = self.__is_name(first_name, middle_names, last_name)

        author = self.__join_name((first_name, middle_names, last_name), normalize_names=normalize_names) if is_name else None
        return (author, is_name)

    def __parse_institution(self, institution_raw, plausibility_check=False):
        institution = {
                'Name': institution_raw, 
                'Country': 'undefined', 
                'Code': 'undefined'}

        is_institution = True

        if plausibility_check:
                is_institution = self.grid_lookup.get_institution(institution_raw) != None
                institution = self.grid_lookup.get_institution(institution_raw) if is_institution else None
        else:
                is_institution_tmp = self.grid_lookup.get_institution(institution_raw) != None
                institution = self.grid_lookup.get_institution(institution_raw) if is_institution_tmp else institution

        return institution, is_institution


    def get_authors(self, plausibility_check=True, clean_names=True, normalize_names=True):
        authors = []

        for author in self.json['metadata']['authors']:
            institution, _ = self.__parse_institution(
                institution_raw=author['affiliation'].get('institution'),
                plausibility_check=plausibility_check)

            author, _ = self.__parse_author(
                raw_author=author,
                clean_names=clean_names, 
                normalize_names=normalize_names,
                plausibility_check=plausibility_check)
            
            if author is not None and author is not '' and author is not ' ' and isinstance(author, str):
                authors.append((author, institution))

        return authors

    def get_authors_statistic(self, plausibility_check=True, clean_names=True):
        matched_authors = 0
        matched_institutions = 0
        nones = 0
        total = len(self.json['metadata']['authors'])

        for author in self.json['metadata']['authors']:

            if author['affiliation'].get('institution') is None:
                nones+=1

            _, is_institution = self.__parse_institution(
                institution_raw=author['affiliation'].get('institution'),
                plausibility_check=plausibility_check)

            _, is_author = self.__parse_author(
                raw_author=author,
                clean_names=clean_names, 
                plausibility_check=plausibility_check)
            
            if is_author: matched_authors+=1
            if is_institution: matched_institutions+=1

        return (matched_authors, matched_institutions, total, nones)


    def get_bib_entries(self):
        ref_entries = []
        index = 1
        ref_entry = self.json['bib_entries'].get(f'BIBREF{index}')
        while ref_entry is not None:
            index+=1
            title = ref_entry['title']
            authors = [self.__parse_author(a, True, True, True) for a in ref_entry['authors']]
            ref_entries.append((title, authors))
            ref_entry = self.json['bib_entries'].get(f'BIBREF{index}')

        return ref_entries

    def get_raw_json(self):
        return self.json

    def get_paper_id(self):
        return self.json['paper_id']


def get_files(root_dir):
    json_paths = [
        join(root_dir, 'arxiv', 'arxiv', 'pdf_json'),
        join(root_dir, 'arxiv', 'arxiv', 'pdf_json'),
        join(root_dir, 'comm_use_subset', 'comm_use_subset', 'pdf_json'),
        join(root_dir, 'noncomm_use_subset', 'noncomm_use_subset', 'pdf_json'),
        join(root_dir, 'custom_license', 'custom_license', 'pdf_json'),
        join(root_dir, 'biorxiv_medrxiv', 'biorxiv_medrxiv', 'pdf_json'),
    ]

    files = []
    [files.extend(glob(join(path, '*.json'))) for path in json_paths]
    return files


def get_paper_id(fpath, dl=None):
    if dl is None: dl = DataLoader(fpath)
    return dl.get_paper_id()

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

def get_authors(fpath, dl=None, plausibility_check=True, clean_names=True, normalize_names=True):
    if dl is None: dl = DataLoader(fpath)
    return dl.get_authors(plausibility_check, clean_names, normalize_names)

def get_bib_entries(fpath, dl=None):
    if dl is None: dl = DataLoader(fpath)
    return dl.get_bib_entries()

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

def get_sections(): return {'title': 0, 'abstract': 1, 'body_text': 2 }