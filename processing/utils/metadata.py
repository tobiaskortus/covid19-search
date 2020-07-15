import pickle
import pandas as pd
from os.path import isdir, isfile, join, dirname
from os import getcwd, pardir

class CORDMetadata:
    CORD_ROOT_DIR = join(pardir, 'dataset')
    CORD_METADATA_CSV = join(CORD_ROOT_DIR, 'metadata.csv')
    CORD_METADATA_PKL = join(CORD_ROOT_DIR, 'metadata.pkl')

    def __init__(self):
        if not isdir(self.CORD_ROOT_DIR):
            raise Exception('Could not find /dataset')
        if not isfile(self.CORD_METADATA_CSV):
            raise Exception('Could not find metadata.csv')

        if not isfile(self.CORD_METADATA_PKL):
            metadata = pd.read_csv(self.CORD_METADATA_CSV)
            metadata_dict = self.__get_dict_from_pd(metadata)
            self.__save_dict(metadata_dict)
        
        self.metadata = self.__load_dict()

    def __load_dict(self):
        with open(self.CORD_METADATA_PKL, 'rb') as f:
            return pickle.load(f)

    def __save_dict(self, data_dict):
         with open(self.CORD_METADATA_PKL, 'wb') as f:
            pickle.dump(data_dict, f, pickle.HIGHEST_PROTOCOL)

    def __get_dict_from_pd(self, data):
        data_dict = dict()
        for _, row in data.iterrows():
            data_dict[row.sha] = {'journal': row.journal, 'url': row.url}
        return data_dict

    def get_metadata_dict(self):
        return self.metadata

    def get_journal(self, sha):
        result = self.metadata.get(sha)
        if result is None: return None
        return None if result['journal'] is None else str(result['journal'])

    def get_document_url(self, sha):
        result = self.metadata.get(sha)
        if result is None: return 'undefined'
        return 'undefined' if result['url'] is None else str(result['url'])

    def get_authors(self, sha):
        raise NotImplementedError()

    
