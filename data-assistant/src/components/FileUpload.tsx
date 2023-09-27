"use client";
import { uploadToS3 } from "@/lib/s3";
import { useMutation } from "@tanstack/react-query";
import { Inbox, Loader2 } from "lucide-react";
import React from "react";
import { useDropzone } from "react-dropzone";
import axios from "axios";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";

// https://github.com/aws/aws-sdk-js-v3/issues/4126

const FileUpload = () => {
    const router = useRouter();
    const [uploading, setUploading] = React.useState(false);
    const [uploadedFiles, setUploadedFiles] = React.useState<string[]>([]);
    const { mutate, isLoading } = useMutation({
    mutationFn: async ({
        file_key,
        file_name,
    }: {
        file_key: string;
        file_name: string;
    }) => {
        const response = await axios.post("/api/create-chat", {
        file_key,
        file_name,
        });
        return response.data;
    },
    });

    const {getRootProps, getInputProps} = useDropzone({
        accept: [
            // Text and CSV
            'text/plain',
            'text/csv',
            // Excel
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            // PDF
            'application/pdf',
            // Word Document
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            // XML
            'application/xml',
            'text/xml',
        ].join(', ') as any,
        maxFiles: 20,
        onDrop: async (acceptedFiles) => {
            setUploading(true);  // Set uploading to true at the start
          
            const uploadPromises = acceptedFiles.map(file => {
              if (file.size > 10000 * 1024 * 1024) {
                toast.error('File size too large. Needs to be less than 10GB');
                return Promise.resolve(null);  // return a resolved promise with null for this file
              }
          
              return uploadToS3(file)
                .then(data => {
                  if (!data?.file_key || !data.file_name) {
                    toast.error("Error uploading file");
                    return null;  // return null for this file
                  }
                  return data;  // return data for this file
                })
                .catch(error => {
                  console.log(error);
                  return null;  // return null for this file on error
                });
            });
          
            // Wait for all uploads to complete
            const uploadResults = await Promise.all(uploadPromises);
          
            // Filter out any null values
            const successfulUploads = uploadResults.filter(result => result) as any[];
          
            // If there were successful uploads, mutate the data and update the state
            if (successfulUploads.length > 0) {
              const mutationPromises = successfulUploads.map(data =>
                mutate(data)
              );
          
              // Wait for all mutations to complete
              await Promise.all(mutationPromises);
          
              // Update the state with the names of successfully uploaded files
              setUploadedFiles(prevFiles => [
                ...prevFiles,
                ...successfulUploads.map(data => data.file_name)
              ]);
          
              toast.success(`${successfulUploads.length} file(s) were uploaded successfully!`);
            }
            setUploading(false);  // Set uploading to false at the end
          },
        
          });
          return (
            <div className="p-2 bg-white rounded-xl">
              <div
                {...getRootProps({
                  className:
                    "border-dashed border-2 rounded-xl cursor-pointer bg-gray-50 py-8 flex justify-center items-center flex-col",
                })}
              >
                <input {...getInputProps()} />
                {uploading || isLoading ? (
                  <>
                    {/* loading state */}
                    <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
                    <p className="mt-2 text-sm text-slate-400">
                      Spilling Tea to GPT...
                    </p>
                  </>
                ) : (
                  <>
                    <Inbox className="w-10 h-10 text-blue-500" />
                    <p className="mt-2 text-sm text-slate-400">Drop data files here</p>
                  </>
                )}
            </div>
                    {/* Render the list of uploaded files */}
            <div className="mt-4">
                <h4 className="text-lg font-bold mb-2">Uploaded Files:</h4>
                <ul>
                    {uploadedFiles.map((fileName, index) => (
                        <li key={index}>{fileName}</li>
                    ))}
                </ul>
            </div>
            </div>
          );
        };
        
        export default FileUpload;