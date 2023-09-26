'use client'
import React from 'react'
import { Inbox } from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import { uploadToS3 } from '@/lib/s3'


const FileUpload = () => {
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
            console.log(acceptedFiles)
            const file = acceptedFiles[0]
            if (file.size > 10000 * 1024 * 1024) {
                alert('File size exceeds 10 GB')
                return
            }

            const data = await uploadToS3(file)
        },
    });
  return (
    <div className='p-2 bg-white rounded-xl'>
        <div {...getRootProps({
            className: 'text-center border-2 border-dashed rounded-xl cursor-pointer bg-gray-50 py-8 flex justify-center items-center flex-col',
        })}>
            <input {...getInputProps()} />
            <>
            <Inbox className='w-10 h-10 text-blue-500'/>
            <p className='mt-2 text-sm text-slate-400'>Drop data files here </p>
            </>
        </div>
    </div>
  )
}

export default FileUpload