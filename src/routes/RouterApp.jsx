import { PanelPostulante } from "../pages/PanelPostulante";
import { PostulacionesTable } from "../pages/PostulacionesTable";
import {BuscadorPostulante} from "../pages/BuscadorPostulante";
import {GestorRRHH} from "../pages/GestorRRHH";
import {PanelGHDocumentos} from "../pages/PanelGHDocumentos";


export let routes = [
    {
        path: "/",
        element: <BuscadorPostulante />,
    },
    {
        path: "/postulacionesTable",
        element: <PostulacionesTable />,
    },
    {
        path: "/postulante/:documento",
        element: <PanelPostulante />,
    },
    {
        path: "/gestorRRHH",
        element: <GestorRRHH />,
    },
    {
        path: "/panelGHDocumentos",
        element: <PanelGHDocumentos />,
    },

];
