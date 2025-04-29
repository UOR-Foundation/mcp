/**
 * Linked Data Decomposition Algorithm
 * Implements prime decomposition for linked data structures
 */

import { PrimeFactor, PrimeDecomposition, CanonicalRepresentation } from '../core/uor-core';
import { BaseDecompositionAlgorithm } from './decomposition-types';

/**
 * Node in a linked data structure
 */
interface LinkedNode {
  id: string;
  type?: string;
  properties?: Record<string, any>;
  [key: string]: any;
}

/**
 * Edge in a linked data structure
 */
interface LinkedEdge {
  source: string;
  target: string;
  type?: string;
  properties?: Record<string, any>;
  [key: string]: any;
}

/**
 * Linked data structure
 */
interface LinkedData {
  nodes: LinkedNode[];
  edges: LinkedEdge[];
  metadata?: Record<string, any>;
}

/**
 * Linked data decomposition algorithm
 * Decomposes graph-like data structures into nodes and edges
 */
export class LinkedDataDecompositionAlgorithm extends BaseDecompositionAlgorithm {
  /**
   * Creates a new linked data decomposition algorithm
   */
  constructor() {
    super('linked-data-decomposition', 'linked-data');
  }

  /**
   * Decompose linked data into prime factors
   * @param data Linked data to decompose
   * @returns Prime decomposition of the linked data
   */
  decompose(data: any): PrimeDecomposition {
    if (!data || typeof data !== 'object') {
      throw new Error('Input must be a valid linked data object');
    }

    const linkedData = this.extractLinkedData(data);

    const factors: PrimeFactor[] = [];

    factors.push(
      this.createPrimeFactor('structure', {
        nodeCount: linkedData.nodes.length,
        edgeCount: linkedData.edges.length,
        directed: this.isDirectedGraph(linkedData),
        cyclic: this.hasCycles(linkedData),
      })
    );

    linkedData.nodes.forEach(node => {
      factors.push(
        this.createPrimeFactor(`node-${node.id}`, {
          id: node.id,
          type: node.type,
          properties: node.properties || {},
        })
      );
    });

    linkedData.edges.forEach((edge, index) => {
      factors.push(
        this.createPrimeFactor(`edge-${index}`, {
          source: edge.source,
          target: edge.target,
          type: edge.type,
          properties: edge.properties || {},
        })
      );
    });

    if (linkedData.metadata) {
      factors.push(this.createPrimeFactor('metadata', { metadata: linkedData.metadata }));
    }

    const connectedComponents = this.findConnectedComponents(linkedData);

    factors.push(
      this.createPrimeFactor('connectivity', {
        connectedComponents: connectedComponents.length,
        componentSizes: connectedComponents.map(component => component.length),
      })
    );

    const centralNodes = this.calculateCentralNodes(linkedData);

    if (centralNodes.length > 0) {
      factors.push(this.createPrimeFactor('centrality', { centralNodes }));
    }

    return this.createDecomposition(factors, 'graph-elements');
  }

  /**
   * Recompose linked data from prime factors
   * @param decomposition Prime decomposition to recompose
   * @returns Recomposed linked data
   */
  recompose(decomposition: PrimeDecomposition): LinkedData {
    const result: LinkedData = {
      nodes: [],
      edges: [],
    };

    const nodeFactors = decomposition.primeFactors.filter(factor => factor.id.startsWith('node-'));

    nodeFactors.forEach(factor => {
      const node: LinkedNode = {
        id: (factor.value as any).id,
        type: (factor.value as any).type,
        properties: (factor.value as any).properties || {},
      };

      result.nodes.push(node);
    });

    const edgeFactors = decomposition.primeFactors.filter(factor => factor.id.startsWith('edge-'));

    edgeFactors.forEach(factor => {
      const edge: LinkedEdge = {
        source: (factor.value as any).source,
        target: (factor.value as any).target,
        type: (factor.value as any).type,
        properties: (factor.value as any).properties || {},
      };

      result.edges.push(edge);
    });

    const metadataFactor = decomposition.primeFactors.find(factor => factor.id === 'metadata');

    if (metadataFactor) {
      result.metadata = (metadataFactor.value as any).metadata;
    }

    return result;
  }

  /**
   * Compute canonical representation from prime decomposition
   * @param decomposition Prime decomposition
   * @returns Canonical representation
   */
  computeCanonical(decomposition: PrimeDecomposition): CanonicalRepresentation {
    const linkedData = this.recompose(decomposition);

    const normalized = this.normalizeLinkedData(linkedData);

    const coherenceNorm = this.calculateGraphCoherence(normalized);

    return this.createCanonicalRepresentation(
      { normalizedGraph: normalized },
      'normalized-graph',
      coherenceNorm
    );
  }

  /**
   * Extract linked data from input data
   * @param data Input data
   * @returns Linked data structure
   */
  private extractLinkedData(data: any): LinkedData {
    if (data.nodes && data.edges && Array.isArray(data.nodes) && Array.isArray(data.edges)) {
      return {
        nodes: data.nodes,
        edges: data.edges,
        metadata: data.metadata,
      };
    }

    if (data.vertices && data.links) {
      return {
        nodes: data.vertices.map((vertex: any) => ({
          id: vertex.id || vertex._id || `node-${Math.random().toString(36).substr(2, 9)}`,
          type: vertex.type,
          properties: vertex.properties || vertex,
        })),
        edges: data.links.map((link: any) => ({
          source: link.source || link.from,
          target: link.target || link.to,
          type: link.type,
          properties: link.properties || link,
        })),
        metadata: data.metadata,
      };
    }

    if (
      Array.isArray(data) &&
      data.length > 0 &&
      data[0].subject &&
      data[0].predicate &&
      data[0].object
    ) {
      const nodes = new Map<string, LinkedNode>();
      const edges: LinkedEdge[] = [];

      data.forEach((triple: any) => {
        if (!nodes.has(triple.subject)) {
          nodes.set(triple.subject, {
            id: triple.subject,
            type: 'subject',
          });
        }

        if (!nodes.has(triple.object)) {
          nodes.set(triple.object, {
            id: triple.object,
            type: 'object',
          });
        }

        edges.push({
          source: triple.subject,
          target: triple.object,
          type: triple.predicate,
        });
      });

      return {
        nodes: Array.from(nodes.values()),
        edges,
      };
    }

    throw new Error('Unsupported linked data format');
  }

  /**
   * Check if the graph is directed
   * @param linkedData Linked data
   * @returns Whether the graph is directed
   */
  private isDirectedGraph(linkedData: LinkedData): boolean {
    const edgePairs = new Set<string>();

    for (const edge of linkedData.edges) {
      const forwardKey = `${edge.source}->${edge.target}`;
      const backwardKey = `${edge.target}->${edge.source}`;

      if (edgePairs.has(backwardKey)) {
        return false; // Found a bidirectional edge, graph is undirected
      }

      edgePairs.add(forwardKey);
    }

    return true; // No bidirectional edges found, graph is directed
  }

  /**
   * Check if the graph has cycles
   * @param linkedData Linked data
   * @returns Whether the graph has cycles
   */
  private hasCycles(linkedData: LinkedData): boolean {
    const adjacencyList = new Map<string, string[]>();

    linkedData.nodes.forEach(node => {
      adjacencyList.set(node.id, []);
    });

    linkedData.edges.forEach(edge => {
      const neighbors = adjacencyList.get(edge.source) || [];
      neighbors.push(edge.target);
      adjacencyList.set(edge.source, neighbors);
    });

    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const hasCycleFromNode = (nodeId: string): boolean => {
      if (!visited.has(nodeId)) {
        visited.add(nodeId);
        recursionStack.add(nodeId);

        const neighbors = adjacencyList.get(nodeId) || [];

        for (const neighbor of neighbors) {
          if (!visited.has(neighbor) && hasCycleFromNode(neighbor)) {
            return true;
          } else if (recursionStack.has(neighbor)) {
            return true;
          }
        }
      }

      recursionStack.delete(nodeId);
      return false;
    };

    for (const node of linkedData.nodes) {
      if (!visited.has(node.id) && hasCycleFromNode(node.id)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Find connected components in the graph
   * @param linkedData Linked data
   * @returns Array of connected components (arrays of node IDs)
   */
  private findConnectedComponents(linkedData: LinkedData): string[][] {
    const adjacencyList = new Map<string, Set<string>>();

    linkedData.nodes.forEach(node => {
      adjacencyList.set(node.id, new Set<string>());
    });

    linkedData.edges.forEach(edge => {
      const sourceNeighbors = adjacencyList.get(edge.source) || new Set<string>();
      sourceNeighbors.add(edge.target);
      adjacencyList.set(edge.source, sourceNeighbors);

      const targetNeighbors = adjacencyList.get(edge.target) || new Set<string>();
      targetNeighbors.add(edge.source);
      adjacencyList.set(edge.target, targetNeighbors);
    });

    const visited = new Set<string>();
    const components: string[][] = [];

    for (const node of linkedData.nodes) {
      if (!visited.has(node.id)) {
        const component: string[] = [];
        const queue: string[] = [node.id];

        visited.add(node.id);
        component.push(node.id);

        while (queue.length > 0) {
          const current = queue.shift()!;
          const neighbors = adjacencyList.get(current) || new Set<string>();

          for (const neighbor of neighbors) {
            if (!visited.has(neighbor)) {
              visited.add(neighbor);
              component.push(neighbor);
              queue.push(neighbor);
            }
          }
        }

        components.push(component);
      }
    }

    return components;
  }

  /**
   * Calculate central nodes in the graph
   * @param linkedData Linked data
   * @returns Array of central node IDs
   */
  private calculateCentralNodes(linkedData: LinkedData): string[] {
    const nodeDegrees = new Map<string, number>();

    linkedData.nodes.forEach(node => {
      nodeDegrees.set(node.id, 0);
    });

    linkedData.edges.forEach(edge => {
      const sourceDegree = nodeDegrees.get(edge.source) || 0;
      nodeDegrees.set(edge.source, sourceDegree + 1);

      const targetDegree = nodeDegrees.get(edge.target) || 0;
      nodeDegrees.set(edge.target, targetDegree + 1);
    });

    const degrees = Array.from(nodeDegrees.values());
    const averageDegree = degrees.reduce((sum, degree) => sum + degree, 0) / degrees.length;
    const threshold = averageDegree * 1.5;

    const centralNodes: string[] = [];

    nodeDegrees.forEach((degree, nodeId) => {
      if (degree > threshold) {
        centralNodes.push(nodeId);
      }
    });

    return centralNodes;
  }

  /**
   * Normalize linked data
   * @param linkedData Linked data
   * @returns Normalized linked data
   */
  private normalizeLinkedData(linkedData: LinkedData): LinkedData {
    const nodeIdMap = new Map<string, string>();

    linkedData.nodes.forEach((node, index) => {
      nodeIdMap.set(node.id, `n${index}`);
    });

    const normalizedNodes = linkedData.nodes.map((node, index) => ({
      id: `n${index}`,
      type: node.type,
      properties: { ...node.properties },
    }));

    const normalizedEdges = linkedData.edges.map((edge, index) => ({
      source: nodeIdMap.get(edge.source) || edge.source,
      target: nodeIdMap.get(edge.target) || edge.target,
      type: edge.type,
      properties: { ...edge.properties },
    }));

    return {
      nodes: normalizedNodes,
      edges: normalizedEdges,
      metadata: linkedData.metadata ? { ...linkedData.metadata } : undefined,
    };
  }

  /**
   * Calculate graph coherence
   * @param linkedData Linked data
   * @returns Coherence value between 0 and 1
   */
  private calculateGraphCoherence(linkedData: LinkedData): number {
    const components = this.findConnectedComponents(linkedData);

    const componentCoherence = components.length === 1 ? 1 : 1 / components.length;

    const maxEdges = (linkedData.nodes.length * (linkedData.nodes.length - 1)) / 2;
    const densityCoherence = maxEdges > 0 ? Math.min(1, linkedData.edges.length / maxEdges) : 1;

    const hasCycles = this.hasCycles(linkedData);
    const structureCoherence = hasCycles ? 0.7 : 1; // Acyclic graphs are more coherent

    return componentCoherence * 0.4 + densityCoherence * 0.3 + structureCoherence * 0.3;
  }
}
