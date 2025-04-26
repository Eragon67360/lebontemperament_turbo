'use client'
import React, { useState, useEffect } from 'react';

interface File {
    id: string;
    name: string;
    type: string;
    mimeType: string;
}
interface FileListProps {
    choeur: string;
}

const FileList: React.FC<FileListProps> = ({ choeur }) => {
    const [files, setFiles] = useState<File[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    let id: string;

    switch (choeur) {
        case "adultes":
            id = "13s6bOADtngPaNFRZnX0eFxS2cXiN48OT";
            break;
        case "jeunes":
            id = "1fHOHQUl--o-6nxfcJ7AkB9gMBOUFQaG3";
            break;
        case "enfants":
            id = "1dWvmexrWNVcdP4w6EAdTHcAwE3E0gR3d";
            break;
        case "orchestre":
            id = "1N9yxM7iFWaiAcyBsIy7n6sQ3u0yK7lHn";
            break;
        default:
            id = "13s6bOADtngPaNFRZnX0eFxS2cXiN48OT";
    }

    useEffect(() => {
        // Function to fetch file data
        const api = '/api/drive/files?folderID='.concat(id.toString());
        const fetchData = async () => {
            try {
                const response = await fetch(api);
                const data = await response.json();
                if (data) {
                    setFiles(data);
                }
            } catch (error) {
                console.error('Failed to fetch files:', error);
            } finally {
                setLoading(false); // Set loading to false regardless of success or failure
            }
        };

        fetchData();
    }, [id]); // Empty dependency array means this effect runs once on mount
    if (loading) {
        return <div>Content loading...</div>;
    }
    return (
        <div>
            <ul>
                {files.map((file) => (
                    <li key={file.id}>{file.name} : {file.type}</li>
                ))}
            </ul>
        </div>
    );
};

export default FileList;
