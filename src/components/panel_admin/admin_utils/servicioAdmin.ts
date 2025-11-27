import { type Schedule, type MediaFiles } from "../../homepage/seccion_servicio/services"

interface Service{
    id:string,
    id_name:string,
    name:string,
    cost:number,
    type:TServiceType,
    tag:string[],
    fullDescription:string,
    itinerary:string[],
    recomendations:string[],
    additional: string[],
    schedule:Schedule,
    mediaFiles:MediaFiles,
}
interface Card{
    compactDescription:string,
    mediaFiles:string[]
}

export interface ServiceGet{
    service:Service,
    card:Card
}

type TSectionName = "avatar" | "slider" | "background" | "galery" | "routes" | "logo" | "card";

// The input schedule from the frontend
interface IScheduleInput {
  startTrip: string;
  endTrip?: string;
}

type TServiceType= "mirabus"|"tour";
type TServiceState= "visible"| "hidden";

// Interface for media files when updating a service
interface IMediaUrl {
  url: string;
}

// interface IMediaFile {
//   fileid: string;
// }

// Complete request body for creating/updating a service
export interface IServiceRequest {
  name: string;
  cost: number;
  type: TServiceType; //mirabus| tour
  serviceState: TServiceState; // visible|hidden|deleted
  tag: string; // "tag1;tag2;tag3"
  compactDescription: string;
  fullDescription: string;
  itinerary: string; // "item1;item2;item3"
  recomendations: string; // "rec1;rec2"
  additional: string; // "add1;add2"
  schedule: IScheduleInput[];
  mediaFiles?: IMediaUrl[]; // URLs de las imagenes que se borran en actualizaciones
}

// Interface for multer files
//fieldname = TSectionName
// export interface IServiceFiles {
//   [fieldname: string]: Express.Multer.File[]; //el dato de adentro es el archivo
// }
//el archivo tiene que tener un metadato que indique a donde va a que seccion pertenece
// (data:IServiceRequest, files:IserviceFiles)
// // Combined interface for service creation/update including files
// export interface IServiceRequestWithFiles {
//   data: IServiceRequest;
//   files: IServiceFiles;
// }

// document.getElementById('uploadForm').addEventListener('submit', async (event) => {
//         event.preventDefault();
//         const fileInput = document.getElementById('fileInput');
//         const file = fileInput.files[0];

//         if (file) {
//             const formData = new FormData();
//             formData.append('myFile', file); // 'myFile' should match the fieldname used in Multer on the backend

//             try {
//                 const response = await fetch('/upload', { // Replace with your backend upload endpoint
//                     method: 'POST',
//                     body: formData,
//                 });
//                 const result = await response.json();
//                 console.log('File uploaded successfully:', result);
//             } catch (error) {
//                 console.error('Error uploading file:', error);
//             }
//         } else {
//             console.warn('No file selected.');
//         }
//     });