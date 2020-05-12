class NLPPipeline:
    def __init__(self, transformers):
        self.transformers = transformers
        
    def transform(self, X):
        result = X
        for transformer in self.transformers:
            result = transformer.transform(result)
        return result
            
            
class NLPTransformer:
    def __init__(self):
        raise Exception('Use of base class')
    
    def transform(self, X):
        raise Exception('Use of base class')
    
    
class Tokenizer(NLPTransformer):
    def __init__(self):
        from nltk.tokenize import RegexpTokenizer
        self.tokenizer = RegexpTokenizer('\w+')
    
    def transform(self, X):
        return self.tokenizer.tokenize(X)
    
    
class StopwordRemover(NLPTransformer):
    def __init__(self):
        from nltk.corpus import stopwords
        self.stop_words = set(stopwords.words('english'))
        self.stop_words.add('fig')
        self.stop_words.add('sec')
        
    def transform(self, X):
        return [token for token in X if token not in self.stop_words] 
    
        
class CitationRemover(NLPTransformer):
    def __init__(self):
        import re
        self.regex = re.compile(r'\[(\d+(?:,\s*\d+)*)\]')
        
    def transform(self, X):
        return self.regex.sub('', X)
    
        
class ToLowercase(NLPTransformer):
    def __init__(self): pass
    
    def transform(self, X):
        return X.lower()
    
    
class Stemmer(NLPTransformer):
    def __init__(self):
        from nltk.stem.porter import PorterStemmer
        self.stemmer = PorterStemmer()
    
    def transform(self, X):
        return [self.stemmer.stem(token) for token in X]
    
    
class Lemmatizer(NLPTransformer):
    def __init__(self):
        from nltk.stem import WordNetLemmatizer
        self.lemmatizer = WordNetLemmatizer()
        
    def transform(self, X):
        return [self.lemmatizer.lemmatize(token) for token in X]
    
class SymbolRemover(NLPTransformer):
    def __init__(self):
        import string
        self.whitelist = string.digits
    
    def transform(self, X):
        return [token for token in X if len(token) > 1 or token in self.whitelist]
    
class ContentInBracketsRemover(NLPTransformer):
    def __init__(self):
        import re
        self.regex = re.compile(r'\([^()]*\)|\{[^()]*\}')
        
    def transform(self, X):
        return self.regex.sub('', X)
        