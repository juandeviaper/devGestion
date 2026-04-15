import axios from 'axios';
import type { AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { authService } from './authService';
import type { 
    Project, User, PublicProfileData, UserStory, Sprint, Epic, Task, Bug, 
    Comment, Attachment, ProjectMember, AcceptanceCriterion,
    Invitation, Notification, AuthResponse, MyWorkItems
} from '../types';

const API_BASE_URL = 'http://localhost:8000/api';

const api = axios.create({
    baseURL: API_BASE_URL,
});

// Add a request interceptor to include the JWT token
api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const token = authService.getAccessToken();
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add a response interceptor to handle token expiration
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        if (error.response && error.response.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            const refreshToken = authService.getRefreshToken();
            if (refreshToken) {
                try {
                    const response = await axios.post<AuthResponse>(`${API_BASE_URL}/token/refresh/`, { refresh: refreshToken });
                    const { access } = response.data;
                    authService.setSession(access, refreshToken as string, authService.getUser() as User);
                    if (originalRequest.headers) {
                        originalRequest.headers.Authorization = `Bearer ${access}`;
                    }
                    return api(originalRequest);
                } catch (refreshError) {
                    // El refresh falló — sesión expirada
                    authService.clearSession();
                    if (!window.location.pathname.includes('/login')) {
                        import('react-hot-toast').then(({ toast }) => {
                            toast.error('Tu sesión ha expirado. Por favor, inicia sesión de nuevo.');
                        });
                        window.location.href = '/login';
                    }
                    return Promise.reject(refreshError);
                }
            } else {
                // No hay refresh token — limpiar sesión
                authService.clearSession();
                if (!window.location.pathname.includes('/login')) {
                    window.location.href = '/login';
                }
            }
        }
        return Promise.reject(error);
    }
);

export default api;

export const projectService = {
    getAll: (): Promise<AxiosResponse<Project[]>> => api.get<Project[]>('/proyectos/'),
    getStats: <T = Record<string, number>>(): Promise<AxiosResponse<T>> => api.get<T>('/proyectos/stats/'),
    getUserStats: (username: string): Promise<AxiosResponse<Record<string, number>>> => api.get<Record<string, number>>(`/proyectos/user_stats/?username=${username}`),
    getById: (id: string | number): Promise<AxiosResponse<Project>> => api.get<Project>(`/proyectos/${id}/`),
    getMembers: (id: string | number): Promise<AxiosResponse<ProjectMember[]>> => api.get<ProjectMember[]>(`/proyectos/${id}/members/`),
    addMember: (projectId: string | number, username: string, rol: string = 'colaborador'): Promise<AxiosResponse<unknown>> => 
        api.post(`/proyectos/${projectId}/add_member/`, { username, rol }),
    removeMember: (projectId: string, username: string): Promise<AxiosResponse<unknown>> => 
        api.post(`/proyectos/${projectId}/remove_member/`, { username }),

    create: (data: Partial<Project>): Promise<AxiosResponse<Project>> => api.post<Project>('/proyectos/', data),
    update: (id: string | number, data: Partial<Project>): Promise<AxiosResponse<Project>> => api.patch<Project>(`/proyectos/${id}/`, data),
    delete: (id: string | number): Promise<AxiosResponse<void>> => api.delete(`/proyectos/${id}/`),
    isOwner: (members: ProjectMember[], userId: number | undefined): boolean => {
        if (!userId) return false;
        const currentUserMember = members.find(m => m.usuario_detalle.id === userId);
        return currentUserMember?.rol_proyecto === 'dueño';
    },
    getMetrics: (projectId: string | number): Promise<AxiosResponse<any>> => api.get<any>(`/proyectos/${projectId}/metrics/`),
    downloadReport: (projectId: string | number): Promise<AxiosResponse<Blob>> => api.get<Blob>(`/proyectos/${projectId}/download_report/`, { responseType: 'blob' }),
};


export const storyService = {
    getByProject: (projectId: string | number): Promise<AxiosResponse<UserStory[]>> => api.get<UserStory[]>(`/historias/?proyecto=${projectId}`),
    getBySprint: (sprintId: string | number): Promise<AxiosResponse<UserStory[]>> => api.get<UserStory[]>(`/historias/?sprint=${sprintId}`),
    getById: (id: string | number): Promise<AxiosResponse<UserStory>> => api.get<UserStory>(`/historias/${id}/`),
    create: (data: Partial<UserStory>): Promise<AxiosResponse<UserStory>> => api.post<UserStory>('/historias/', data),
    update: (id: string | number, data: Partial<UserStory>): Promise<AxiosResponse<UserStory>> => api.patch<UserStory>(`/historias/${id}/`, data),
    delete: (id: string | number): Promise<AxiosResponse<void>> => api.delete(`/historias/${id}/`),
    getAll: (): Promise<AxiosResponse<UserStory[]>> => api.get<UserStory[]>('/historias/'),
    changeStatus: (id: string | number, status: string): Promise<AxiosResponse<UserStory>> => api.patch<UserStory>(`/historias/${id}/change_status/`, { estado: status }),
    importStories: (projectId: string | number, file: File): Promise<AxiosResponse<any>> => {
        const formData = new FormData();
        formData.append('proyecto', projectId.toString());
        formData.append('file', file);
        return api.post('/historias/import/', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },
};


export const sprintService = {
    getAll: (): Promise<AxiosResponse<Sprint[]>> => api.get<Sprint[]>('/sprints/'),
    getByProject: (projectId: string | number): Promise<AxiosResponse<Sprint[]>> => api.get<Sprint[]>(`/sprints/?proyecto=${projectId}`),
    getById: (id: string | number): Promise<AxiosResponse<Sprint>> => api.get<Sprint>(`/sprints/${id}/`),
    create: (data: Partial<Sprint>): Promise<AxiosResponse<Sprint>> => api.post<Sprint>('/sprints/', data),
    update: (id: string | number, data: Partial<Sprint>): Promise<AxiosResponse<Sprint>> => api.patch<Sprint>(`/sprints/${id}/`, data),
    delete: (id: string | number): Promise<AxiosResponse<void>> => api.delete(`/sprints/${id}/`),
    iniciar: (id: string | number): Promise<AxiosResponse<any>> => api.post(`/sprints/${id}/iniciar/`),
    finalizar: (id: string | number): Promise<AxiosResponse<any>> => api.post(`/sprints/${id}/finalizar/`),
};

export const epicService = {
    getByProject: (projectId: string | number): Promise<AxiosResponse<Epic[]>> => api.get<Epic[]>(`/epicas/?proyecto=${projectId}`),
    create: (data: Partial<Epic>): Promise<AxiosResponse<Epic>> => api.post<Epic>('/epicas/', data),
    getById: (id: string | number): Promise<AxiosResponse<Epic>> => api.get<Epic>(`/epicas/${id}/`),
    update: (id: string | number, data: Partial<Epic>): Promise<AxiosResponse<Epic>> => api.patch<Epic>(`/epicas/${id}/`, data),
    delete: (id: string | number): Promise<AxiosResponse<void>> => api.delete(`/epicas/${id}/`),
};


export const taskService = {
    getByProject: (projectId: string | number): Promise<AxiosResponse<Task[]>> => api.get<Task[]>(`/tareas/?proyecto=${projectId}`),
    getByStory: (storyId: string | number): Promise<AxiosResponse<Task[]>> => api.get<Task[]>(`/tareas/?historia=${storyId}`),
    getById: (id: string | number): Promise<AxiosResponse<Task>> => api.get<Task>(`/tareas/${id}/`),
    create: (data: Partial<Task>): Promise<AxiosResponse<Task>> => api.post<Task>('/tareas/', data),
    update: (id: string | number, data: Partial<Task>): Promise<AxiosResponse<Task>> => api.patch<Task>(`/tareas/${id}/`, data),
    delete: (id: string | number): Promise<AxiosResponse<void>> => api.delete(`/tareas/${id}/`),
    getAll: (): Promise<AxiosResponse<Task[]>> => api.get<Task[]>('/tareas/'),
    changeStatus: (id: string | number, status: string): Promise<AxiosResponse<Task>> => api.patch<Task>(`/tareas/${id}/change_status/`, { estado: status }),
};


export const bugService = {
    getByProject: (projectId: string | number): Promise<AxiosResponse<Bug[]>> => api.get<Bug[]>(`/bugs/?proyecto=${projectId}`),
    getById: (id: string | number): Promise<AxiosResponse<Bug>> => api.get<Bug>(`/bugs/${id}/`),
    create: (data: Partial<Bug>): Promise<AxiosResponse<Bug>> => api.post<Bug>('/bugs/', data),
    update: (id: string | number, data: Partial<Bug>): Promise<AxiosResponse<Bug>> => api.patch<Bug>(`/bugs/${id}/`, data),
    delete: (id: string | number): Promise<AxiosResponse<void>> => api.delete(`/bugs/${id}/`),
    getAll: (): Promise<AxiosResponse<Bug[]>> => api.get<Bug[]>('/bugs/'),
    changeStatus: (id: string | number, status: string): Promise<AxiosResponse<Bug>> => api.patch<Bug>(`/bugs/${id}/change_status/`, { estado: status }),
};


export const userService = {
    search: (query: string): Promise<AxiosResponse<User[]>> => api.get<User[]>(`/users/?search=${query}`),
    getPublicProfile: (username: string): Promise<AxiosResponse<PublicProfileData>> => api.get<PublicProfileData>(`/users/${username}/public_profile/`),

    updateProfile: async (data: Partial<User> | FormData): Promise<User> => {
        const isFormData = data instanceof FormData;
        const response = await api.patch<User>(`/me/`, data, {
            headers: {
                'Content-Type': isFormData ? 'multipart/form-data' : 'application/json',
            },
        });
        return response.data;
    },
    checkUsername: (username: string): Promise<AxiosResponse<{ available: boolean }>> => api.get<{ available: boolean }>(`/users/check_username/?username=${username}`),
    deleteProfile: (): Promise<AxiosResponse<void>> => api.delete('/me/'),

    // Admin User Management
    adminGetAll: (): Promise<AxiosResponse<User[]>> => api.get<User[]>('/users/'),
    adminCreate: (data: Partial<User>): Promise<AxiosResponse<User>> => api.post<User>('/users/', data),
    adminUpdate: (id: number, data: Partial<User>): Promise<AxiosResponse<User>> => api.patch<User>(`/users/${id}/`, data),
    adminDelete: (id: number): Promise<AxiosResponse<void>> => api.delete(`/users/${id}/`),
    getMyWorkItems: (): Promise<AxiosResponse<MyWorkItems>> => api.get<MyWorkItems>('/me/work-items/'),
};


export const criteriaService = {
    getByStory: (storyId: string | number): Promise<AxiosResponse<AcceptanceCriterion[]>> => api.get<AcceptanceCriterion[]>(`/criterios/?historia=${storyId}`),
    create: (data: Partial<AcceptanceCriterion>): Promise<AxiosResponse<AcceptanceCriterion>> => api.post<AcceptanceCriterion>('/criterios/', data),
    update: (id: string | number, data: Partial<AcceptanceCriterion>): Promise<AxiosResponse<AcceptanceCriterion>> => api.patch<AcceptanceCriterion>(`/criterios/${id}/`, data),
    delete: (id: string | number): Promise<AxiosResponse<void>> => api.delete(`/criterios/${id}/`),
};

export const commentService = {
    getByStory: (storyId: string | number): Promise<AxiosResponse<Comment[]>> => api.get<Comment[]>(`/comentarios/?historia=${storyId}`),
    getByProject: (projectId: string | number): Promise<AxiosResponse<Comment[]>> => api.get<Comment[]>(`/comentarios/?proyecto=${projectId}`),
    create: (data: Partial<Comment>): Promise<AxiosResponse<Comment>> => api.post<Comment>('/comentarios/', data),
    delete: (id: string | number): Promise<AxiosResponse<void>> => api.delete(`/comentarios/${id}/`),
};

export const attachmentService = {
    getByStory: (storyId: string | number): Promise<AxiosResponse<Attachment[]>> => api.get<Attachment[]>(`/adjuntos/?historia=${storyId}`),
    create: (data: FormData): Promise<AxiosResponse<Attachment>> => api.post<Attachment>('/adjuntos/', data),
    delete: (id: string | number): Promise<AxiosResponse<void>> => api.delete(`/adjuntos/${id}/`),
};

export const invitationService = {
    getAll: (): Promise<AxiosResponse<Invitation[]>> => api.get<Invitation[]>('/invitaciones/'),
    create: (data: { proyecto: number; usuario_invitado: number; rol_invitado: string }): Promise<AxiosResponse<Invitation>> => 
        api.post<Invitation>('/invitaciones/', data),
    aceptar: (id: number): Promise<AxiosResponse<unknown>> => api.post(`/invitaciones/${id}/aceptar/`),
    rechazar: (id: number): Promise<AxiosResponse<unknown>> => api.post(`/invitaciones/${id}/rechazar/`),
};

export const notificationService = {
    getAll: (): Promise<AxiosResponse<Notification[]>> => api.get<Notification[]>('/notifications/'),
    markAsRead: (id: number): Promise<AxiosResponse<unknown>> => api.post(`/notifications/${id}/mark_as_read/`),
    markAllAsRead: (): Promise<AxiosResponse<unknown>> => api.post('/notifications/mark_all_as_read/'),
};
