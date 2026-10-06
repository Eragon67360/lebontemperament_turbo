-- Migration: size and type limits on the `programs` bucket (#440)
--
-- « Espace de travail » uploads work files from the browser straight to this
-- private bucket with the admin's session, so nothing on the server checks
-- them. The bucket had no limits (file_size_limit and allowed_mime_types were
-- null on 2026-10-06, when it held 0 objects). From now on Storage itself
-- refuses a file over 50 MB or of another type, wherever the upload comes
-- from.
--
-- The type list is the same as WORK_FILE_TYPES in
-- apps/admin/utils/workFiles.ts (a unit test compares them): PDF, images
-- (no SVG), audio, MIDI, MusicXML, plain text and office documents. Generic
-- XML and HTML are left out because they can carry scripts.
--
-- Additive: nothing is dropped or renamed. Rollback: set both columns back to
-- null.

UPDATE storage.buckets
   SET file_size_limit = 52428800, -- 50 MB
       allowed_mime_types = ARRAY[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/avif',
    'image/heic',
    'image/heif',
    'audio/mpeg',
    'audio/mp3',
    'audio/mp4',
    'audio/x-m4a',
    'audio/aac',
    'audio/wav',
    'audio/x-wav',
    'audio/wave',
    'audio/ogg',
    'audio/webm',
    'audio/flac',
    'audio/x-flac',
    'audio/midi',
    'audio/x-midi',
    'application/vnd.recordare.musicxml+xml',
    'application/vnd.recordare.musicxml',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.oasis.opendocument.text',
    'application/vnd.oasis.opendocument.spreadsheet',
    'application/vnd.oasis.opendocument.presentation'
       ]
 WHERE id = 'programs';
