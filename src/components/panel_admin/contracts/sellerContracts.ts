//RECUERDEN MANTENER LOS CONTRATOS ACTUALIZADOS EN EL FRONTEND Y EN EL BACKEND

/**
 *
 */
export interface sellerFilters {
    active?: boolean;
    code?: string;
}

/**
 * Esta interfaz define el request que se va a entregar al frontend al hacer un GET: /users/sellers
 */
export interface getSellerResponse {
    name: string;
    code: string;
    dni: string | null;
    phoneNumber: string | null;
    active: boolean;
}

/**
 * Esta interfaz define el request que tiene que llegar desde el frontend para crear un vendedor
 */
export interface CreateSellerRequest {
    name: string;
    dni?: string;
    phoneNumber?: string;
    active?: boolean;
}

//Esto por el momento no se va  usar xd
export interface CreateSellerResponse {
    id: string;
    name: string;
    code: string;
    active: boolean;
    createdAt: Date;
}
/**
 * Interfaz que define los datos para actualizar un vendedor
 */
export interface UpdateSellerRequest {
  name?: string;
  dni?: string;
  phoneNumber?: string;
}
