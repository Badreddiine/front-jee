const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080/api"

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  tokenType: string
  expiresIn: number
  utilisateur: any
}

export interface ApiError {
  status: number
  message: string
}

export function getAuthHeaders() {
  const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  }
}

/**
 * Fonction centrale pour les appels API
 * CORRIGÉE pour éviter le crash "undefined toString"
 */
export async function apiCall(endpoint: string, options: RequestInit = {}) {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      credentials: "include",
      headers: {
        ...getAuthHeaders(),
        ...options.headers,
      },
    })

    const contentType = response.headers.get("content-type")
    let data: any

    // 1. Tentative de lecture des données (JSON ou Texte)
    if (contentType?.includes("application/json")) {
      try {
        data = await response.json()
      } catch (e) {
        data = null // Erreur de parsing JSON
      }
    } else {
      data = await response.text()
    }

    // 2. Gestion des Erreurs HTTP (400, 401, 500...)
    if (!response.ok) {
      // On cherche le message le plus pertinent
      let errorMessage = `Erreur API (${response.status})`

      let responseBody: any = data
      if (typeof data === "object" && data !== null) {
        // Si le backend renvoie { "message": "..." } ou { "error": "..." }
        errorMessage = data.message || data.error || JSON.stringify(data)
      } else if (typeof data === "string" && data.length > 0) {
        // Si le backend renvoie juste du texte brut comme erreur
        errorMessage = data
      }

      // Construire une erreur enrichie avec status et body pour faciliter le debug
      const err: any = new Error(errorMessage)
      err.status = response.status
      err.body = responseBody
      throw err
    }

    return data
  } catch (error: any) {
    // Gestion spécifique si le serveur est éteint
    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new Error("Impossible de contacter le serveur. Vérifiez que le Backend est lancé.")
    }
    // On relance l'erreur pour qu'elle soit attrapée par le composant
    throw error
  }
}

// --- DÉFINITIONS DES API ---

export const authApi = {
  login: (email: string, password: string) =>
    apiCall("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  register: (userData: {
    email: string
    motDePasse: string
    nom: string
    prenom: string
    identifiant?: string
    photoProfile?: string
    avatar?: string
  }) =>
    apiCall("/auth/inscription", {
      method: "POST",
      body: JSON.stringify(userData),
    }),

  logout: () =>
    apiCall("/auth/logout", {
      method: "POST",
    }),

  me: () => apiCall("/auth/me"),

  refresh: (id: number, refreshToken: string) =>
    apiCall("/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ id, refreshToken }),
    }),
}

export const userApi = {
  getById: (id: number) => apiCall(`/utilisateurs/${id}`),

  update: (id: number, userData: any) =>
    apiCall(`/utilisateurs/${id}`, {
      method: "PUT",
      body: JSON.stringify(userData),
    }),

  changePassword: (id: number, ancienMotDePasse: string, nouveauMotDePasse: string) =>
    apiCall(`/utilisateurs/${id}/mot-de-passe`, {
      method: "PATCH",
      body: JSON.stringify({ ancienMotDePasse, nouveauMotDePasse }),
    }),

  getAll: () => apiCall("/utilisateurs"),

  search: (query: { q?: string; nom?: string; prenom?: string; email?: string }) =>
    apiCall(`/utilisateurs/recherche?${new URLSearchParams(Object.entries(query).filter(([, v]) => v) as any)}`),
}

export const projetApi = {
  create: (data: any, userId?: number) => {
    // Some backend endpoints expect groupeId as a request parameter rather than in the JSON body.
    // If present, include it in the query string and remove it from the body to avoid duplication.
    let qs = data && data.groupeId ? `?groupeId=${encodeURIComponent(String(data.groupeId))}` : ""
    if (userId) {
      qs = qs ? `${qs}&idUserConnecter=${encodeURIComponent(String(userId))}` : `?idUserConnecter=${encodeURIComponent(String(userId))}`
    }
    const body = { ...data }
    if (body.groupeId) delete body.groupeId
    return apiCall(`/projets/creer${qs}`, {
      method: "POST",
      body: JSON.stringify(body),
    })
  },

  getAll: () => apiCall("/projets/liste"),

  getById: (id: number) => apiCall(`/projets/${id}`),

  update: (id: number, data: any) =>
    apiCall(`/projets/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: (id: number) =>
    apiCall(`/projets/supprimer/${id}`, {
      method: "DELETE",
    }),

  getPublic: () => apiCall("/projets/publics"),

  search: (query: string) => apiCall(`/projets/rechercher?q=${encodeURIComponent(query)}`),

  getByTheme: (theme: string) => apiCall(`/projets/theme/${theme}`),

  getByStatus: (status: string) => apiCall(`/projets/statut/${status}`),

  getMembers: (id: number) => apiCall(`/projets/${id}/membres`),

  getAdmins: (id: number) => apiCall(`/projets/${id}/admins`),

  getPendingRequests: (id: number) => apiCall(`/projets/${id}/demandes-en-attente`),

  getStatistics: (id: number) => apiCall(`/projets/${id}/statistiques`),

  accept: (projetId: number) =>
    apiCall("/projets/accepter", {
      method: "PUT",
      body: JSON.stringify({ projetId }),
    }),

  reject: (projetId: number) =>
    apiCall("/projets/rejeter", {
      method: "PUT",
      body: JSON.stringify({ projetId }),
    }),

  close: (projetId: number) =>
    apiCall("/projets/cloturer", {
      method: "PUT",
      body: JSON.stringify({ projetId }),
    }),

  reopen: (projetId: number) =>
    apiCall("/projets/reactiver", {
      method: "PUT",
      body: JSON.stringify({ projetId }),
    }),

  addMember: (projetId: number, utilisateurId: number) =>
    apiCall("/projets/membres/ajouter", {
      method: "POST",
      body: JSON.stringify({ projetId, utilisateurId }),
    }),

  removeMember: (projetId: number, utilisateurId: number) =>
    apiCall("/projets/membres/supprimer", {
      method: "DELETE",
      body: JSON.stringify({ projetId, utilisateurId }),
    }),

  promoteToAdmin: (projetId: number, utilisateurId: number) =>
    apiCall("/projets/admins/promouvoir", {
      method: "POST",
      body: JSON.stringify({ projetId, utilisateurId }),
    }),

  demoteFromAdmin: (projetId: number, utilisateurId: number) =>
    apiCall("/projets/admins/retrograder", {
      method: "POST",
      body: JSON.stringify({ projetId, utilisateurId }),
    }),

  acceptRequest: (projetId: number, utilisateurId: number) =>
    apiCall("/projets/demandes/accepter", {
      method: "POST",
      body: JSON.stringify({ projetId, utilisateurId }),
    }),

  rejectRequest: (projetId: number, utilisateurId: number) =>
    apiCall("/projets/demandes/refuser", {
      method: "POST",
      body: JSON.stringify({ projetId, utilisateurId }),
    }),
}

export const tacheApi = {
  create: (data: any) =>
    apiCall("/taches", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getAll: () => apiCall("/taches"),

  getById: (id: number) => apiCall(`/taches/${id}`),

  update: (id: number, data: any) =>
    apiCall(`/taches/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: (id: number) =>
    apiCall(`/taches/${id}`, {
      method: "DELETE",
    }),

  getByProject: (projetId: number) => apiCall(`/taches/projet/${projetId}`),

  getByUser: (utilisateurId: number) => apiCall(`/taches/utilisateur/${utilisateurId}`),

  getByStatus: (etat: string) => apiCall(`/taches/etat/${etat}`),

  updateStatus: (id: number, etat: string) =>
    apiCall(`/taches/${id}/etat`, {
      method: "PATCH",
      body: JSON.stringify({ etat }),
    }),

  assign: (tacheId: number, utilisateurId: number) =>
    apiCall(`/taches/${tacheId}/assigner/${utilisateurId}`, {
      method: "PATCH",
    }),
}

export const sousTacheApi = {
  getByTache: (tacheId: number) => apiCall(`/sous-taches/tache/${tacheId}`),

  create: (tacheId: number, data: any) =>
    apiCall(`/sous-taches/${tacheId}`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: number, data: any) =>
    apiCall(`/sous-taches/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: (id: number) =>
    apiCall(`/sous-taches/${id}`, {
      method: "DELETE",
    }),
}

export const reunionApi = {
  getAll: async () => {
    const response = await apiCall("/reunions")
    return response
  },
  getById: async (id: number) => {
    const response = await apiCall(`/reunions/${id}`)
    return response
  },
  create: async (data: any) => {
    const response = await apiCall("/reunions", {
      method: "POST",
      body: JSON.stringify(data),
    })
    return response
  },
  update: async (id: number, data: any) => {
    const response = await apiCall(`/reunions/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
    return response
  },
  delete: async (id: number) => {
    await apiCall(`/reunions/${id}`, { method: "DELETE" })
  },
  addParticipant: async (id: number, userId: number) => {
    await apiCall(`/reunions/${id}/participants/${userId}`, { method: "POST" })
  },
  removeParticipant: async (id: number, userId: number) => {
    await apiCall(`/reunions/${id}/participants/${userId}`, { method: "DELETE" })
  },
}

export const groupeApi = {
  getAll: async () => {
    const response = await apiCall("/groupes")
    return response
  },
  getById: async (id: number) => {
    const response = await apiCall(`/groupes/${id}`)
    return response
  },
  create: async (data: any, userId: number) => {
    const response = await apiCall(`/groupes/creer?idUserConnecter=${userId}`, {
      method: "POST",
      body: JSON.stringify(data),
    })
    return response
  },
  update: async (id: number, data: any) => {
    const response = await apiCall(`/groupes/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
    return response
  },
  delete: async (id: number) => {
    await apiCall(`/groupes/${id}`, { method: "DELETE" })
  },
  addMember: async (id: number, userId: number) => {
    await apiCall(`/groupes/${id}/membres/ajouter`, { 
      method: "POST",
      body: JSON.stringify({ groupeId: id, utilisateurId: userId })
    })
  },
  removeMember: async (id: number, userId: number) => {
    await apiCall(`/groupes/${id}/membres/supprimer`, { 
      method: "DELETE",
      body: JSON.stringify({ groupeId: id, utilisateurId: userId })
    })
  },
}

export const calendrierApi = {
  getAll: async () => {
    const response = await apiCall("/calendriers")
    return response
  },
  getById: async (id: number) => {
    const response = await apiCall(`/calendriers/${id}`)
    return response
  },
  create: async (data: any) => {
    const response = await apiCall("/calendriers", {
      method: "POST",
      body: JSON.stringify(data),
    })
    return response
  },
  update: async (id: number, data: any) => {
    const response = await apiCall(`/calendriers/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
    return response
  },
  delete: async (id: number) => {
    await apiCall(`/calendriers/${id}`, { method: "DELETE" })
  },
  shareWith: async (id: number, userId: number) => {
    await apiCall(`/calendriers/${id}/partage/${userId}`, { method: "POST" })
  },
  unshareWith: async (id: number, userId: number) => {
    await apiCall(`/calendriers/${id}/partage/${userId}`, { method: "DELETE" })
  },
}

export const evenementApi = {
  getAll: async () => {
    const response = await apiCall("/evenements")
    return response
  },
  getById: async (id: number) => {
    const response = await apiCall(`/evenements/${id}`)
    return response
  },
  getByCalendar: async (calendrierId: number) => {
    const response = await apiCall(`/evenements/calendrier/${calendrierId}`)
    return response
  },
  create: async (data: any) => {
    const response = await apiCall("/evenements", {
      method: "POST",
      body: JSON.stringify(data),
    })
    return response
  },
  update: async (id: number, data: any) => {
    const response = await apiCall(`/evenements/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
    return response
  },
  delete: async (id: number) => {
    await apiCall(`/evenements/${id}`, { method: "DELETE" })
  },
  addParticipant: async (id: number, userId: number) => {
    await apiCall(`/evenements/${id}/participants/${userId}`, { method: "POST" })
  },
  removeParticipant: async (id: number, userId: number) => {
    await apiCall(`/evenements/${id}/participants/${userId}`, { method: "DELETE" })
  },
}

export const listeDiffusionApi = {
  getAll: async () => {
    const response = await apiCall("/listes-diffusion")
    return response
  },
  getById: async (id: number) => {
    const response = await apiCall(`/listes-diffusion/${id}`)
    return response
  },
  create: async (data: any) => {
    const response = await apiCall("/listes-diffusion", {
      method: "POST",
      body: JSON.stringify(data),
    })
    return response
  },
  update: async (id: number, data: any) => {
    const response = await apiCall(`/listes-diffusion/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
    return response
  },
  delete: async (id: number) => {
    await apiCall(`/listes-diffusion/${id}`, { method: "DELETE" })
  },
  addMember: async (id: number, userId: number) => {
    await apiCall(`/listes-diffusion/${id}/membres/${userId}`, { method: "POST" })
  },
  removeMember: async (id: number, userId: number) => {
    await apiCall(`/listes-diffusion/${id}/membres/${userId}`, { method: "DELETE" })
  },
  addAdmin: async (id: number, userId: number) => {
    await apiCall(`/listes-diffusion/${id}/administrateurs/${userId}`, { method: "POST" })
  },
  removeAdmin: async (id: number, userId: number) => {
    await apiCall(`/listes-diffusion/${id}/administrateurs/${userId}`, { method: "DELETE" })
  },
}

export const salleDiscussionApi = {
  getAll: async () => {
    const response = await apiCall("/salles-discussion")
    return response
  },
  getById: async (id: number) => {
    const response = await apiCall(`/salles-discussion/${id}`)
    return response
  },
  getByUser: async (userId: number) => {
    const response = await apiCall(`/salles-discussion/utilisateur/${userId}`)
    return response
  },
  getByProject: async (projectId: number) => {
    const response = await apiCall(`/salles-discussion/projet/${projectId}/salles`)
    return response
  },
  getByGroup: async (groupId: number) => {
    const response = await apiCall(`/salles-discussion/groupe/${groupId}/salles`)
    return response
  },
  create: async (data: any) => {
    const response = await apiCall("/salles-discussion", {
      method: "POST",
      body: JSON.stringify(data),
    })
    return response
  },
  createGroupRoom: async (groupId: number, data: any) => {
    const response = await apiCall(`/salles-discussion/groupe/${groupId}`, {
      method: "POST",
      body: JSON.stringify(data),
    })
    return response
  },
  update: async (id: number, data: any) => {
    const response = await apiCall(`/salles-discussion/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
    return response
  },
  delete: async (id: number) => {
    await apiCall(`/salles-discussion/${id}`, { method: "DELETE" })
  },
  addMember: async (id: number, userId: number) => {
    await apiCall(`/salles-discussion/${id}/membres/${userId}`, { method: "POST" })
  },
  removeMember: async (id: number, userId: number) => {
    await apiCall(`/salles-discussion/${id}/membres/${userId}`, { method: "DELETE" })
  },
}

export const api = {
  auth: authApi,
  user: userApi,
  projet: projetApi,
  tache: tacheApi,
  sousTache: sousTacheApi,
  reunion: reunionApi,
  groupe: groupeApi,
  calendrier: calendrierApi,
  evenement: evenementApi,
  listeDiffusion: listeDiffusionApi,
  salleDiscussion: salleDiscussionApi,
}