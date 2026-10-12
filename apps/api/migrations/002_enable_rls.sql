ALTER TABLE public.documents
    ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.document_versions
    ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.document_chunks
    ENABLE ROW LEVEL SECURITY;