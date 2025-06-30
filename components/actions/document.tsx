"use client";

import { useAuth } from '@/lib/context/AuthContext';
import { DocumentDetailType, DocumentsResponseType } from '@/types/documents.types';
import { table } from 'console';
import { format } from 'date-fns';
import { FileDown, EllipsisVertical, FileText, LoaderCircle } from 'lucide-react';
import { useState } from 'react';

export const Documents = ({ documents }: { documents: DocumentsResponseType }) => {
    const { userInfo } = useAuth();
    const [downloading, setDownloading] = useState<string | null>(null);

    const handleDownload = async (doc: DocumentDetailType) => {
        try {
            setDownloading(doc.PK);

            // Use our internal API route to avoid CORS issues
            const downloadUrl = `${process.env.NEXT_PUBLIC_FXAPI}JobDocument/DownloadFile/${doc.PK}/${userInfo.AppPK}`;
            
            // Create a filename from the document properties
            const filename = doc.FileName || `${doc.DocumentType}.${doc.FileExtension}`;
            
            // Fetch the file
            const response = await fetch(downloadUrl, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': userInfo.AuthToken,
                    Accept: 'application/json'
                },
            });

            // Check if the request was successful
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            // Process the download
            const json = await response.json();
            
            // Check if we have the Base64 string in the response
            if (json?.Response && json.Response?.Base64str) {                
                // Create a function to save the byte array
                const saveByteArray = (() => {
                    const a = document.createElement("a");
                    document.body.appendChild(a);
                    a.style.display = "none";
                    
                    return (data: BlobPart[], name: string, type?: string) => {
                        const blob = new Blob(data, {
                            type: type || "octet/stream"
                        });
                        const url = window.URL.createObjectURL(blob);
                        a.href = url;
                        a.download = name;
                        a.click();
                        window.URL.revokeObjectURL(url);
                    };
                })();

                // Convert Base64 to array buffer
                const base64ToArrayBuffer = (base64: string) => {
                    const binaryString = atob(base64);
                    const bytes = new Uint8Array(binaryString.length);
                    
                    for (let i = 0; i < binaryString.length; i++) {
                        bytes[i] = binaryString.charCodeAt(i);
                    }
                    
                    // Save the file with the appropriate content type
                    saveByteArray([bytes], filename, doc.ContentType || undefined);
                };

                // Process and download the file
                base64ToArrayBuffer(json.Response.Base64str);
                
                // Reset downloading state
                setDownloading(null);
            } else {
                throw new Error("No file data received");
            }
        } catch (error) {
            console.error('Error downloading document:', error);
            setDownloading(null);
            
            // Show a user-friendly error message
            let errorMessage = 'Failed to download the document. Please try again later.';
            
            if (error instanceof Error) {
                // If it's a network error (likely CORS-related), provide a specific message
                if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
                    errorMessage = 'Network error: Unable to connect to the document server. This might be due to network connectivity issues or server unavailability.';
                } else {
                    errorMessage = `Error: ${error.message}`;
                }
            }
            
            alert(errorMessage);
        }
    };

    const tableHead = [
        "#",
        "Download",
        "Document Name",
        "Type",
        "Description",        
        "Created By",
        "Created Date"
    ]
    const tableBody = [
        "DocumentName",
        "DocumentType",
        "Description",
        "CreatedBy",
        "CreatedDateTime"
    ]
    return (
        <>
            <div className="mb-4">I found <b>{documents.count} Documents</b> related to your query.</div>
            {(!documents.value || documents.value.length === 0) ? <div>If you have any further questions or need additional information, feel free to ask!</div> :
                <div className="overflow-auto rounded-lg w-full">
                    <table className='min-w-full border-collapse text-sm'>
                        <thead className="bg-zinc-100 dark:bg-zinc-800">
                            <tr className="hover:bg-zinc-50 dark:hover:bg-zinc-900">
                                {tableHead.map((headItem, headIndex) => (
                                    <th className="px-4 py-3 text-left font-medium text-zinc-700 dark:text-zinc-300 whitespace-nowrap" key={headIndex}>{headItem}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
                            {documents && documents.value && documents.value.length > 0 &&
                                documents.value.map((document: any, documentIndex: number) => (
                                    <tr className="hover:bg-zinc-50 dark:hover:bg-zinc-900" key={documentIndex}>
                                        <td className="px-4 py-3 border-t border-zinc-200 dark:border-zinc-700 whitespace-nowrap">{documentIndex + 1}</td>
                                        <td className="px-4 py-3 border-t border-zinc-200 dark:border-zinc-700 whitespace-nowrap">
                                            <button
                                                onClick={() => !downloading && handleDownload(document)}
                                                disabled={downloading === document.PK}
                                                className="flex items-center justify-center"
                                            >
                                                { downloading !== document.PK?
                                                <FileDown
                                                    size={16}
                                                    className={`${downloading === document.PK ? 'text-gray-400' : 'text-blue-500'} cursor-pointer`}
                                                />
                                                 :
                                                <LoaderCircle size={16} className='animate-spin'/>
                                                }
                                            </button>
                                        </td>
                                        {tableBody.map((bodyItem, bodyIndex) => (
                                            <td className="px-4 py-3 border-t border-zinc-200 dark:border-zinc-700 whitespace-nowrap" key={bodyIndex}>
                                                {bodyItem === "CreatedDateTime" && document[bodyItem] 
                                                    ? format(new Date(document[bodyItem]), 'MMMM d, yyyy') 
                                                    : bodyItem === "DocumentName"? document[bodyItem] + "." + document["FileExtension"] : document[bodyItem]}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>
            }
        </>
    )
}