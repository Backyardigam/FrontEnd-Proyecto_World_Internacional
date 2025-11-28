import { type Schedule, type MediaFiles } from "../../homepage/seccion_servicio/services"
/**
 * Datos de la seccion servicio.
 * Sirven para construir la vista del formulario
 * en su seccion correspondiente
 */
interface Service{
    id:string,
    id_name:string,
    name:string,
    cost:string,
    type:TServiceType,
    serviceState?:TServiceState,
    tag:string[],
    fullDescription:string,
    itinerary:string[],
    recomendations:string[],
    additional: string[],
    schedule:Schedule,
    mediaFiles?:MediaFiles,
}

/**
 * Datos de la seccion card
 */
interface Card{
    compactDescription:string,
    mediaFiles:string[]
}

/**
 * Payload que llega del GET a /manage/service/
 */
export interface ServiceGet{
    service:Service,
    card:Card
}

// type TSectionName = "avatar" | "slider" | "background" | "galery" | "routes" | "logo" | "card";

// The input schedule from the frontend
export interface IScheduleInput {
  startTrip: string;
  endTrip?: string;
}

type TServiceType= "mirabus"|"tour";

//ahora en vez de un patch va a ser un put
type TServiceState= "visible"| "hidden";

// Interface for media files when updating a service
export interface IMediaUrl {
  url: string;
}

// Complete request body for creating/updating a service
/**
 * Forma del Payload que se entrega al POST
 * de /manage/service/ (Para creacion)
 * o /manage/service/{id} (Para edicion)
 * 
 */
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

//para la estructura patch
interface request extends Partial<IServiceRequest>{

}