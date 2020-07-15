from os.path import isdir, isfile, join, dirname, realpath
from os import getcwd, mkdir, remove
from .download import download_file
from zipfile import ZipFile
import pandas as pd
import pickle

try:
    from cfuzzyset import cFuzzySet as FuzzySet
except ImportError:
    from fuzzyset import FuzzySet

#TODO: Add abstract base class for Lookup classes


class CountryCodeLookup:
    GRID_DIR = dirname(realpath(__file__))
    GRID_DATA_ROOT = join(GRID_DIR, 'data')
    COUNTRY_CODES_URL = 'https://datahub.io/core/country-list/r/data.csv'
    COUNTRY_CODES_CSV = 'coutry_codes.csv'
    COUNTRY_CODES_PKL = 'country_codes.pkl'

    def __init__(self):
        if not isdir(self.GRID_DATA_ROOT):
            mkdir(self.GRID_DATA_ROOT)

        if not isfile(join(self.GRID_DATA_ROOT, self.COUNTRY_CODES_CSV)):
            sucess = self.__download_dataset()
            if not sucess:
                raise Exception('Failed downloading grid dataset from https://www.grid.ac/')

        if not isfile(join(self.GRID_DATA_ROOT, self.COUNTRY_CODES_PKL)):
            csv_path = join(self.GRID_DATA_ROOT, self.COUNTRY_CODES_CSV)
            data = self.__load_csv(csv_path)
            self.data_dict = self.__get_dict_from_pd(data)
            self.__save_dict(self.data_dict)
        else:
            self.data_dict = self.__load_dict()
        
    def __download_dataset(self,):
        try:
            download_file(self.COUNTRY_CODES_URL, join(self.GRID_DATA_ROOT, self.COUNTRY_CODES_CSV))
            return True
        except:
            return False

    def __load_csv(self, path):
        return pd.read_csv(path)

    def __get_dict_from_pd(self, data):
        data_dict = dict()
        for _, row in data.iterrows():
            data_dict[row.Name] = row.Code
        return data_dict

    def __save_dict(self, grid_dict):
        with open(join(self.GRID_DATA_ROOT, self.COUNTRY_CODES_PKL), 'wb') as f:
            pickle.dump(grid_dict, f, pickle.HIGHEST_PROTOCOL)

    def __load_dict(self):
        with open(join(self.GRID_DATA_ROOT, self.COUNTRY_CODES_PKL), 'rb') as f:
            return pickle.load(f)

    def get_raw_dict(self):
        return self.data_dict

    def get_country_code(self, name):
        return self.data_dict.get(name)


class GridLookup:
    GRID_DATASET_ZIP_NAME = 'grid.zip'
    GRID_DATASET_URL = 'https://digitalscience.figshare.com/ndownloader/files/22091379'
    GRID_DIR = dirname(realpath(__file__))
    GRID_DATA_ROOT = join(GRID_DIR, 'data')
    GRID_DATA_CSV = 'grid.csv'
    GRID_DATA_DICT = 'grid_dict.pkl'

    def __init__(self, use_fuzzy_matching=True):
        self.country_lookup = CountryCodeLookup()

        if not isdir(self.GRID_DATA_ROOT):
            mkdir(self.GRID_DATA_ROOT)

        if not isfile(join(self.GRID_DATA_ROOT, self.GRID_DATA_CSV)):
            sucess = self.__download_dataset()
            if not sucess:
                raise Exception('Failed downloading grid dataset from https://www.grid.ac/')

        if not isfile(join(self.GRID_DATA_ROOT, self.GRID_DATA_DICT)):
            csv_path = join(self.GRID_DATA_ROOT, self.GRID_DATA_CSV)
            data = self.__load_csv(csv_path)
            self.data_dict = self.__get_dict_from_pd(data)
            self.__save_dict(self.data_dict)
        else:
            self.data_dict = self.__load_dict()

        self.use_fuzzy_matching = use_fuzzy_matching
        if use_fuzzy_matching:
            self.fuzzy_set = FuzzySet()
            [self.fuzzy_set.add(x) for x in self.data_dict];


    def __download_dataset(self):
        try:
            zip_file = join(self.GRID_DATA_ROOT, self.GRID_DATASET_ZIP_NAME)
            download_file(self.GRID_DATASET_URL, zip_file)
            self.__extract_zip(zip_file)
            remove(zip_file)
            return True
        except:
            return False
        
    def __extract_zip(self, zip_file):
        with ZipFile(zip_file, 'r') as zip_ref:
            zip_ref.extractall(self.GRID_DATA_ROOT)

    def __load_csv(self, path):
        return pd.read_csv(path)

    def __get_dict_from_pd(self, data):
        data_dict = dict()
        for _, row in data.iterrows():
            code = self.country_lookup.get_country_code(row.Country)
            data_dict[row.Name] = {
                'Name': row.Name, 
                'Country': row.Country, 
                'Code': code if code is not None else 'undefined'} #TODO: Fix missing country codes (e.g. South Korea)
        return data_dict

    def __save_dict(self, grid_dict):
        with open(join(self.GRID_DATA_ROOT, self.GRID_DATA_DICT), 'wb') as f:
            pickle.dump(grid_dict, f, pickle.HIGHEST_PROTOCOL)


    def __load_dict(self):
        with open(join(self.GRID_DATA_ROOT, 'grid_dict.pkl'), 'rb') as f:
            return pickle.load(f)

    def __fuzzy_match_institution(self, name):
        result = self.fuzzy_set.get(name)

        if result is None or len(result) == 0: 
            return None

        score, match = result[0]
        return match if score > 0.90 else None

    def get_institution(self, name):
        if name is None: return None
        institution = self.data_dict.get(name)
        if self.use_fuzzy_matching and institution is None:
            matched_name = self.__fuzzy_match_institution(name)
            if matched_name is None:
                return None
            return self.data_dict.get(matched_name)
        return institution

    def get_all_institutions(self):
        return self.data_dict.keys()