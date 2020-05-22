def create_chunks(files, chunk_size=128):
    doc_ids = list(range(len(files)))
    chunks = list()
    for i in range(0, len(files), chunk_size):
        chunks.append(list(zip(
            files[i: min(i+chunk_size, len(files))], 
            doc_ids[i: min(i+chunk_size, len(files))])))
    return chunks