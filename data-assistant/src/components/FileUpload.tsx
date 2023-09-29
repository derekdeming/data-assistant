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
            const newUploadedFiles: string[]= [];  // Array to collect the names of successfully uploaded files
        
            for (const file of acceptedFiles) {
                if (file.size > 10000 * 1024 * 1024) {
                    toast.error('File size too large. Needs to be less than 10GB');
                    continue;  // Skip to the next file
                }
        
                try {
                    setUploading(true);
                    const data = await uploadToS3(file);
                    console.log("meow", data);
                    if (!data?.file_key || !data.file_name) {
                        toast.error("Error uploading file");
                        continue;  // Skip to the next file
                    }
                    mutate(data, {
                        onSuccess: ({ chat_id }) => {
                          toast.success("Files were uploaded!");  
                          newUploadedFiles.push(file.name);  // Add the file name to the newUploadedFiles array
                          router.push(`/chat/${chat_id}`);
                        },
                        onError: (err) => {
                            toast.error("Error creating chat");
                            console.error(err);
                        },
                    });
                } catch (error) {
                    console.log(error);
                } finally {
                    setUploading(false);
                }
            }
            // Update the state with all new uploaded files
            setUploadedFiles(prevFiles => [...prevFiles, ...newUploadedFiles]);
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