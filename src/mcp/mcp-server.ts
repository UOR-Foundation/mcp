import { UORObject } from '../core/uor-core';
import { GitHubClient } from '../github/github-client';
import { UORDBManager } from '../github/uordb-manager';
import ContentManager from '../content/content-manager';
import { ContentType, ContentBase, ConceptContent, ResourceContent, TopicContent, PredicateContent, MediaContent } from '../content/content-types';
import { ConceptObject } from '../content/concept';
import { ResourceObject } from '../content/resource';
import { TopicObject } from '../content/topic';
import { PredicateObject } from '../content/predicate';
import { MediaObject } from '../content/media';
import { IdentityManager, IdentityObject } from '../identity/identity-manager';
import { ProfileManager, ProfileImageArtifact } from '../identity/profile-manager';
import { ProfileInfo, CustomProfileField, PublicIdentityView } from '../identity/identity-types';

// Custom interface for stored UOR objects
interface StoredUORObject {
  type: string;
  data: any;
  reference: string;
}

// Client-side compatible MCP server implementation
export class MCPServer {
  private static instance: MCPServer;
  private uordbManager: UORDBManager | null = null;
  private currentUser: { username: string, token: string } | null = null;
  private contentManager: typeof ContentManager;
  private identityManager: IdentityManager;
  private profileManager: ProfileManager;

  private constructor() {
    // Initialize managers
    this.contentManager = ContentManager;
    this.identityManager = IdentityManager.getInstance();
    this.profileManager = ProfileManager.getInstance();
  }

  public static getInstance(): MCPServer {
    if (!MCPServer.instance) {
      MCPServer.instance = new MCPServer();
    }
    return MCPServer.instance;
  }

  public setAuthentication(username: string, token: string): void {
    this.currentUser = { username, token };
    
    // Initialize GitHub client and UORdb manager
    const githubClient = new GitHubClient({ token });
    this.uordbManager = new UORDBManager(githubClient);
  }

  public clearAuthentication(): void {
    this.currentUser = null;
    this.uordbManager = null;
  }

  public isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  public getCurrentUsername(): string | null {
    return this.currentUser?.username || null;
  }

  public async initializeRepository(): Promise<void> {
    if (!this.uordbManager || !this.currentUser) {
      throw new Error('Not authenticated');
    }

    await this.uordbManager.initialize(this.currentUser.username);
  }

  public async getRepositoryStatus(): Promise<any> {
    if (!this.uordbManager || !this.currentUser) {
      throw new Error('Not authenticated');
    }

    try {
      return await this.uordbManager.getRepositoryStatus(this.currentUser.username);
    } catch (error) {
      // Check if repository exists before throwing error
      const exists = await this.checkRepositoryExists();
      if (!exists) {
        throw new Error('Repository does not exist. Please initialize it first.');
      }
      throw error;
    }
  }
  
  /**
   * Check if the repository exists for the current user
   * @returns Whether repository exists
   */
  public async checkRepositoryExists(): Promise<boolean> {
    if (!this.uordbManager || !this.currentUser) {
      throw new Error('Not authenticated');
    }
    
    try {
      const accessStatus = await (this.uordbManager as any).repositoryService.checkRepositoryAccess(
        this.currentUser.username
      );
      return accessStatus.exists;
    } catch (error) {
      console.error('Error checking repository existence:', error);
      return false;
    }
  }

  public async handleRequest(method: string, params: any): Promise<any> {
    switch (method) {
      case 'uor.resolve':
        return this.resolveUOR(params.reference);
      case 'uor.create':
        return this.createUOR(params.type, params.data);
      case 'uor.update':
        return this.updateUOR(params.reference, params.data);
      case 'uor.delete':
        return this.deleteUOR(params.reference);
      case 'uordb.list':
        return this.listUORObjects(params.type);
      case 'uordb.search':
        return this.searchUORObjects(params.query);
      case 'uordb.status':
        return this.getRepositoryStatus();
      case 'uordb.initialize':
        return this.initializeRepository();
      case 'content.createConcept':
        return this.createConcept(params.data, params.id);
      case 'content.createResource':
        return this.createResource(params.data, params.id);
      case 'content.createTopic':
        return this.createTopic(params.data, params.id);
      case 'content.createPredicate':
        return this.createPredicate(params.data, params.id);
      case 'content.createMedia':
        return this.createMedia(params.data, params.id);
      case 'content.update':
        return this.updateContent(params.reference, params.data);
      case 'content.addTag':
        return this.addContentTag(params.reference, params.tag);
      case 'content.removeTag':
        return this.removeContentTag(params.reference, params.tag);
      case 'content.addMediaContent':
        return this.addMediaContent(params.reference, params.content);
      case 'identity.create':
        return this.createIdentity(params.githubUser);
      case 'identity.verify':
        return this.verifyIdentity();
      case 'identity.updateProfile':
        return this.updateIdentityProfile(params.profile);
      case 'identity.addCustomField':
        return this.addCustomProfileField(params.field);
      case 'identity.removeCustomField':
        return this.removeCustomProfileField(params.key);
      case 'identity.setProfileImage':
        return this.setProfileImage(params.imageData, params.mimeType);
      case 'setAuthentication':
        this.setAuthentication(params.username, params.token);
        return true;
      case 'clearAuthentication':
        this.clearAuthentication();
        return true;
      default:
        throw new Error(`Unknown method: ${method}`);
    }
  }

  private async resolveUOR(reference: string): Promise<StoredUORObject | null> {
    // Try to resolve from GitHub repository if authenticated
    if (this.uordbManager && this.currentUser) {
      // Extract type and ID from the reference
      const parts = reference.split('/');
      const type = parts[2]; // Assuming format uor://type/id
      const id = parts.slice(3).join('/');
      
      const object = await this.uordbManager.getObject(this.currentUser.username, type, id);
      
      if (object) {
        return {
          type: object.type,
          data: object,
          reference: reference
        };
      }
    }
    
    // Fallback to local storage for offline or non-GitHub authenticated mode
    const storedData = localStorage.getItem(`uor:${reference}`);
    
    if (!storedData) {
      return null;
    }

    try {
      return JSON.parse(storedData) as StoredUORObject;
    } catch (error) {
      console.error('Error parsing stored UOR:', error);
      return null;
    }
  }

  private async createUOR(type: string, data: any): Promise<string> {
    // Generate a reference 
    const reference = `uor://${type}/${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    // Create UOR object
    const uorObject = {
      id: reference,
      type: type,
      ...data
    };
    
    // Store in GitHub if authenticated
    if (this.uordbManager && this.currentUser) {
      await this.uordbManager.storeObject(this.currentUser.username, uorObject);
    } else {
      // Fallback to localStorage for offline mode
      localStorage.setItem(`uor:${reference}`, JSON.stringify({
        type,
        data: uorObject,
        reference
      }));
    }

    return reference;
  }

  private async updateUOR(reference: string, data: any): Promise<boolean> {
    if (this.uordbManager && this.currentUser) {
      // Extract type and ID from the reference
      const parts = reference.split('/');
      const type = parts[2]; // Assuming format uor://type/id
      const id = parts.slice(3).join('/');
      
      // Get existing object
      const existingObject = await this.uordbManager.getObject(this.currentUser.username, type, id);
      
      if (existingObject) {
        // Update the object
        const updatedObject = {
          ...existingObject,
          ...data,
          id: reference,
          type: type
        };
        
        await this.uordbManager.storeObject(this.currentUser.username, updatedObject);
        return true;
      }
    }
    
    // Fallback to localStorage
    const existingData = localStorage.getItem(`uor:${reference}`);
    
    if (!existingData) {
      return false;
    }

    try {
      const uorObject = JSON.parse(existingData) as StoredUORObject;
      uorObject.data = { ...uorObject.data, ...data };
      
      localStorage.setItem(`uor:${reference}`, JSON.stringify(uorObject));
      return true;
    } catch (error) {
      console.error('Error updating UOR:', error);
      return false;
    }
  }

  private async deleteUOR(reference: string): Promise<boolean> {
    if (this.uordbManager && this.currentUser) {
      // Extract type and ID from the reference
      const parts = reference.split('/');
      const type = parts[2]; // Assuming format uor://type/id
      const id = parts.slice(3).join('/');
      
      try {
        await this.uordbManager.deleteObject(this.currentUser.username, type, id);
        return true;
      } catch (error) {
        console.error('Error deleting UOR from GitHub:', error);
        // Fall back to local storage deletion if GitHub deletion fails
      }
    }
    
    // Fallback or complementary localStorage removal
    const existingData = localStorage.getItem(`uor:${reference}`);
    
    if (!existingData) {
      return false;
    }

    localStorage.removeItem(`uor:${reference}`);
    return true;
  }

  private async listUORObjects(type: string): Promise<any[]> {
    if (!this.uordbManager || !this.currentUser) {
      throw new Error('Not authenticated');
    }

    return await this.uordbManager.listObjects(this.currentUser.username, type);
  }

  private async searchUORObjects(query: string): Promise<any[]> {
    if (!this.uordbManager || !this.currentUser) {
      throw new Error('Not authenticated');
    }

    return await this.uordbManager.searchObjects(this.currentUser.username, query);
  }

  /**
   * Creates a new concept
   * @param id Unique concept ID (optional, generated if not provided)
   * @param data Concept data
   * @returns The UOR reference to the created concept
   */
  private async createConcept(data: Partial<ConceptContent>, id?: string): Promise<string> {
    if (!this.uordbManager || !this.currentUser) {
      throw new Error('Not authenticated');
    }
    
    // Generate ID if not provided
    const conceptId = id || `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    if (!data.createdBy) {
      data.createdBy = this.currentUser.username;
    }
    
    // Create concept object
    const concept = this.contentManager.createConcept(conceptId, data);
    
    // Store in repository
    await this.uordbManager.storeObject(this.currentUser.username, concept);
    
    return `uor://concept/${conceptId}`;
  }
  
  /**
   * Creates a new resource
   * @param id Unique resource ID (optional, generated if not provided)
   * @param data Resource data
   * @returns The UOR reference to the created resource
   */
  private async createResource(data: Partial<ResourceContent>, id?: string): Promise<string> {
    if (!this.uordbManager || !this.currentUser) {
      throw new Error('Not authenticated');
    }
    
    // Generate ID if not provided
    const resourceId = id || `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    if (!data.createdBy) {
      data.createdBy = this.currentUser.username;
    }
    
    // Create resource object
    const resource = this.contentManager.createResource(resourceId, data);
    
    // Store in repository
    await this.uordbManager.storeObject(this.currentUser.username, resource);
    
    return `uor://resource/${resourceId}`;
  }
  
  /**
   * Creates a new topic
   * @param id Unique topic ID (optional, generated if not provided)
   * @param data Topic data
   * @returns The UOR reference to the created topic
   */
  private async createTopic(data: Partial<TopicContent>, id?: string): Promise<string> {
    if (!this.uordbManager || !this.currentUser) {
      throw new Error('Not authenticated');
    }
    
    // Generate ID if not provided
    const topicId = id || `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    if (!data.createdBy) {
      data.createdBy = this.currentUser.username;
    }
    
    // Create topic object
    const topic = this.contentManager.createTopic(topicId, data);
    
    // Store in repository
    await this.uordbManager.storeObject(this.currentUser.username, topic);
    
    return `uor://topic/${topicId}`;
  }
  
  /**
   * Creates a new predicate
   * @param id Unique predicate ID (optional, generated if not provided)
   * @param data Predicate data
   * @returns The UOR reference to the created predicate
   */
  private async createPredicate(data: Partial<PredicateContent>, id?: string): Promise<string> {
    if (!this.uordbManager || !this.currentUser) {
      throw new Error('Not authenticated');
    }
    
    // Generate ID if not provided
    const predicateId = id || `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    if (!data.createdBy) {
      data.createdBy = this.currentUser.username;
    }
    
    // Create predicate object
    const predicate = this.contentManager.createPredicate(predicateId, data);
    
    // Store in repository
    await this.uordbManager.storeObject(this.currentUser.username, predicate);
    
    return `uor://predicate/${predicateId}`;
  }
  
  /**
   * Creates a new media object
   * @param id Unique media ID (optional, generated if not provided)
   * @param data Media data
   * @returns The UOR reference to the created media
   */
  private async createMedia(data: Partial<MediaContent>, id?: string): Promise<string> {
    if (!this.uordbManager || !this.currentUser) {
      throw new Error('Not authenticated');
    }
    
    // Generate ID if not provided
    const mediaId = id || `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    if (!data.createdBy) {
      data.createdBy = this.currentUser.username;
    }
    
    // Create media object
    const media = this.contentManager.createMedia(mediaId, data);
    
    // Store in repository
    await this.uordbManager.storeObject(this.currentUser.username, media);
    
    return `uor://media/${mediaId}`;
  }
  
  /**
   * Updates content
   * @param reference UOR reference to the content
   * @param data Updated content data
   * @returns Whether the update was successful
   */
  private async updateContent(reference: string, data: Partial<ContentBase>): Promise<boolean> {
    if (!this.uordbManager || !this.currentUser) {
      throw new Error('Not authenticated');
    }
    
    // Extract type and ID from the reference
    const parts = reference.split('/');
    const type = parts[2]; // Assuming format uor://type/id
    const id = parts.slice(3).join('/');
    
    // Get existing object
    const existingObject = await this.uordbManager.getObject(this.currentUser.username, type, id);
    
    if (!existingObject) {
      throw new Error(`Content not found: ${reference}`);
    }
    
    // Update the object
    const updatedObject = this.contentManager.updateContent(existingObject as unknown as UORObject, data);
    
    await this.uordbManager.storeObject(this.currentUser.username, updatedObject);
    
    return true;
  }
  
  /**
   * Adds a tag to content
   * @param reference UOR reference to the content
   * @param tag Tag to add
   * @returns Whether the operation was successful
   */
  private async addContentTag(reference: string, tag: string): Promise<boolean> {
    if (!this.uordbManager || !this.currentUser) {
      throw new Error('Not authenticated');
    }
    
    // Extract type and ID from the reference
    const parts = reference.split('/');
    const type = parts[2]; // Assuming format uor://type/id
    const id = parts.slice(3).join('/');
    
    // Get existing object
    const existingObject = await this.uordbManager.getObject(this.currentUser.username, type, id);
    
    if (!existingObject) {
      throw new Error(`Content not found: ${reference}`);
    }
    
    const updatedObject = this.contentManager.addTag(existingObject as unknown as UORObject, tag);
    
    await this.uordbManager.storeObject(this.currentUser.username, updatedObject);
    
    return true;
  }
  
  /**
   * Removes a tag from content
   * @param reference UOR reference to the content
   * @param tag Tag to remove
   * @returns Whether the operation was successful
   */
  private async removeContentTag(reference: string, tag: string): Promise<boolean> {
    if (!this.uordbManager || !this.currentUser) {
      throw new Error('Not authenticated');
    }
    
    // Extract type and ID from the reference
    const parts = reference.split('/');
    const type = parts[2]; // Assuming format uor://type/id
    const id = parts.slice(3).join('/');
    
    // Get existing object
    const existingObject = await this.uordbManager.getObject(this.currentUser.username, type, id);
    
    if (!existingObject) {
      throw new Error(`Content not found: ${reference}`);
    }
    
    const updatedObject = this.contentManager.removeTag(existingObject as unknown as UORObject, tag);
    
    await this.uordbManager.storeObject(this.currentUser.username, updatedObject);
    
    return true;
  }
  
  /**
   * Adds content to a media object
   * @param reference UOR reference to the media
   * @param content Base64-encoded content
   * @returns Whether the operation was successful
   */
  private async addMediaContent(reference: string, content: string): Promise<boolean> {
    if (!this.uordbManager || !this.currentUser) {
      throw new Error('Not authenticated');
    }
    
    // Extract type and ID from the reference
    const parts = reference.split('/');
    const type = parts[2]; // Assuming format uor://type/id
    const id = parts.slice(3).join('/');
    
    if (type !== 'media') {
      throw new Error(`Not a media object: ${reference}`);
    }
    
    // Get existing object
    const existingObject = await this.uordbManager.getObject(this.currentUser.username, type, id);
    
    if (!existingObject) {
      throw new Error(`Media not found: ${reference}`);
    }
    
    const updatedObject = this.contentManager.addMediaContent(existingObject as MediaObject, content);
    
    await this.uordbManager.storeObject(this.currentUser.username, updatedObject);
    
    return true;
  }
  
  /**
   * Creates a new identity for the current user
   * @param githubUser GitHub user information
   * @returns The UOR reference to the created identity
   */
  private async createIdentity(githubUser: { id: string, login: string, name?: string, email?: string }): Promise<string> {
    if (!this.uordbManager || !this.currentUser) {
      throw new Error('Not authenticated');
    }
    
    try {
      // Create identity object
      const identity = await this.identityManager.createIdentity(githubUser);
      
      // Store in repository
      await this.uordbManager.storeObject(this.currentUser.username, identity);
      
      return `uor://identity/${identity.id}`;
    } catch (error) {
      console.error('Error creating identity:', error);
      throw new Error('Failed to create identity');
    }
  }
  
  /**
   * Updates the current user's identity profile
   * @param profile Updated profile information
   * @returns Whether the operation was successful
   */
  private async updateIdentityProfile(profile: Partial<ProfileInfo>): Promise<boolean> {
    if (!this.uordbManager || !this.currentUser) {
      throw new Error('Not authenticated');
    }
    
    try {
      const identities = await this.uordbManager.listObjects(this.currentUser.username, 'identity');
      
      if (identities.length === 0) {
        throw new Error('Identity not found');
      }
      
      const identityData = identities[0];
      
      // Create identity object
      const identity = new IdentityObject(identityData.id, identityData.data);
      
      // Update profile
      this.profileManager.updateProfile(identity, profile);
      
      await this.uordbManager.storeObject(this.currentUser.username, identity);
      
      return true;
    } catch (error) {
      console.error('Error updating profile:', error);
      return false;
    }
  }
  
  /**
   * Adds a custom field to the current user's identity profile
   * @param field Custom field to add
   * @returns Whether the operation was successful
   */
  private async addCustomProfileField(field: CustomProfileField): Promise<boolean> {
    if (!this.uordbManager || !this.currentUser) {
      throw new Error('Not authenticated');
    }
    
    try {
      const identities = await this.uordbManager.listObjects(this.currentUser.username, 'identity');
      
      if (identities.length === 0) {
        throw new Error('Identity not found');
      }
      
      const identityData = identities[0];
      
      // Create identity object
      const identity = new IdentityObject(identityData.id, identityData.data);
      
      this.profileManager.addCustomField(identity, field);
      
      await this.uordbManager.storeObject(this.currentUser.username, identity);
      
      return true;
    } catch (error) {
      console.error('Error adding custom field:', error);
      return false;
    }
  }
  
  /**
   * Removes a custom field from the current user's identity profile
   * @param key Key of the field to remove
   * @returns Whether the operation was successful
   */
  private async removeCustomProfileField(key: string): Promise<boolean> {
    if (!this.uordbManager || !this.currentUser) {
      throw new Error('Not authenticated');
    }
    
    try {
      const identities = await this.uordbManager.listObjects(this.currentUser.username, 'identity');
      
      if (identities.length === 0) {
        throw new Error('Identity not found');
      }
      
      const identityData = identities[0];
      
      // Create identity object
      const identity = new IdentityObject(identityData.id, identityData.data);
      
      this.profileManager.removeCustomField(identity, key);
      
      await this.uordbManager.storeObject(this.currentUser.username, identity);
      
      return true;
    } catch (error) {
      console.error('Error removing custom field:', error);
      return false;
    }
  }
  
  /**
   * Verifies the current user's identity with GitHub
   * @returns Whether verification was successful
   */
  private async verifyIdentity(): Promise<boolean> {
    if (!this.uordbManager || !this.currentUser) {
      throw new Error('Not authenticated');
    }
    
    try {
      const identities = await this.uordbManager.listObjects(this.currentUser.username, 'identity');
      
      if (identities.length === 0) {
        throw new Error('Identity not found');
      }
      
      const identityData = identities[0];
      
      // Create identity object
      const identity = new IdentityObject(identityData.id, identityData.data);
      
      const verified = await this.identityManager.verifyIdentityWithGitHub(
        identity,
        this.currentUser.token
      );
      
      if (verified) {
        await this.uordbManager.storeObject(this.currentUser.username, identity);
      }
      
      return verified;
    } catch (error) {
      console.error('Error verifying identity:', error);
      return false;
    }
  }
  
  /**
   * Sets the profile image for the current user's identity
   * @param imageData Base64-encoded image data
   * @param mimeType Image MIME type
   * @returns Whether the operation was successful
   */
  private async setProfileImage(imageData: string, mimeType: string): Promise<boolean> {
    if (!this.uordbManager || !this.currentUser) {
      throw new Error('Not authenticated');
    }
    
    try {
      const identities = await this.uordbManager.listObjects(this.currentUser.username, 'identity');
      
      if (identities.length === 0) {
        throw new Error('Identity not found');
      }
      
      const identityData = identities[0];
      
      // Create identity object
      const identity = new IdentityObject(identityData.id, identityData.data);
      
      // Create profile image
      const imageArtifact = this.profileManager.createProfileImage(imageData, mimeType);
      
      // Store image artifact
      await this.uordbManager.storeObject(
        this.currentUser.username,
        imageArtifact
      );
      
      // Set profile image reference
      this.profileManager.setProfileImage(identity, imageArtifact);
      
      await this.uordbManager.storeObject(this.currentUser.username, identity);
      
      return true;
    } catch (error) {
      console.error('Error setting profile image:', error);
      return false;
    }
  }
}

export default MCPServer.getInstance();
