'use client'

import { useEffect, useRef } from 'react'
import * as d3 from 'd3'
import { renderToStaticMarkup } from 'react-dom/server'
import { 
  FaDatabase, FaCalendar, FaTools, FaGlobe, FaRobot, FaServer, 
  FaChartLine, FaUser, FaMobile, FaCloud, FaCode, FaDesktop, 
  FaComments, FaMap, FaCamera, FaCar, FaUsers, FaFileAlt, 
  FaSearch, FaMicrophone, FaTree, FaWater, FaHeartbeat, 
  FaMapMarkerAlt, FaShoppingCart, FaChurch, FaLanguage, 
  FaImage, FaHeart, FaHotel, FaTrain, FaGraduationCap, 
  FaBus, FaShieldAlt, FaWifi, FaGamepad, FaSatellite, 
  FaFingerprint, FaLock, FaHospital, FaPlane, FaIndustry, 
  FaBook, FaCross, FaMoneyBill, FaUniversity, FaUtensils, 
  FaDollarSign, FaPrescriptionBottleAlt, FaHardHat, FaCloudSun, 
  FaMountain, FaDog, FaCat, FaDove, FaDumbbell, FaLightbulb, FaStar,
  FaFacebook, FaGithub, FaTiktok, FaTwitter, FaGoogle, 
  FaLinkedin, FaInstagram
} from 'react-icons/fa'

interface Node extends d3.SimulationNodeDatum {
  id: number
  icon: string
  color?: string
  clusterId: number  // Add cluster ID to track which network a node belongs to
  isCore?: boolean   // Flag to identify core nodes (users and robots)
}

interface Link {
  source: number
  target: number
  clusterId: number  // Add cluster ID to track which network a link belongs to
}

// Function to get color based on icon type
function getIconColor(iconName: string): string {
  switch(iconName) {
    // Blues
    case 'cloud': return '#4299E1' // sky blue
    case 'water': return '#3182CE' // blue
    case 'waves': return '#2B6CB0' // darker blue
    case 'airplane': return '#63B3ED' // light blue
    case 'plane': return '#63B3ED' // light blue
    case 'satellite': return '#2C5282' // deep blue
    case 'weather': return '#90CDF4' // very light blue
    case 'wifi': return '#4299E1' // sky blue
    
    // Reds
    case 'heart': return '#F56565' // red
    case 'healthcare': return '#E53E3E' // darker red
    case 'hospital': return '#C53030' // deep red
    case 'health': return '#FC8181' // light red
    case 'cross': return '#FEB2B2' // very light red
    
    // Greens
    case 'tree': return '#48BB78' // green
    case 'mountain': return '#38A169' // darker green
    case 'globe': return '#68D391' // light green
    case 'map': return '#9AE6B4' // very light green
    case 'map-marker': return '#2F855A' // deep green
    
    // Yellows/Golds
    case 'star': return '#ECC94B' // yellow
    case 'money': return '#D69E2E' // gold
    case 'currency': return '#F6E05E' // light yellow
    case 'bank': return '#B7791F' // dark gold
    case 'idea': return '#FAF089' // very light yellow
    case 'lightbulb': return '#FAF089' // very light yellow
    
    // Purples
    case 'robot': return '#805AD5' // purple
    case 'ai': return '#6B46C1' // darker purple
    case 'controller': return '#9F7AEA' // light purple
    case 'gamepad': return '#9F7AEA' // light purple
    
    // Oranges
    case 'cat': return '#ED8936' // orange
    case 'dog': return '#DD6B20' // darker orange
    case 'bird': return '#F6AD55' // light orange
    case 'dumbbells': return '#C05621' // deep orange
    
    // Browns
    case 'utensils': return '#A0522D' // brown
    case 'chef-hat': return '#8B4513' // dark brown
    
    // Pinks
    case 'camera': return '#D53F8C' // pink
    case 'image': return '#ED64A6' // light pink
    
    // Teals
    case 'database': return '#38B2AC' // teal
    case 'server': return '#319795' // darker teal
    case 'api': return '#4FD1C5' // light teal
    case 'code': return '#4FD1C5' // light teal
    
    // Grays
    case 'lock': return '#718096' // gray
    case 'shield': return '#4A5568' // darker gray
    case 'fingerprint': return '#A0AEC0' // light gray
    case 'construction': return '#2D3748' // very dark gray
    case 'hardhat': return '#2D3748' // very dark gray
    
    // Social Media Colors
    case 'facebook': return '#3B5998' // facebook blue
    case 'twitter': return '#1DA1F2' // twitter blue
    case 'instagram': return '#E1306C' // instagram pink/purple
    case 'linkedin': return '#0077B5' // linkedin blue
    case 'github': return '#333333' // github dark gray
    case 'google': return '#4285F4' // google blue
    case 'tiktok': return '#000000' // tiktok black
    
    // Other colors
    case 'user': return '#553C9A' // indigo
    case 'users': return '#6B46C1' // darker purple
    case 'car': return '#2C7A7B' // dark teal
    case 'train': return '#285E61' // darker teal
    case 'bus': return '#234E52' // darkest teal
    case 'tools': return '#702459' // dark pink
    case 'calendar': return '#97266D' // medium pink
    case 'search': return '#B83280' // light pink
    case 'microphone': return '#D53F8C' // lighter pink
    case 'chatbot': return '#667EEA' // indigo
    case 'display': return '#5A67D8' // darker indigo
    case 'mobile': return '#4C51BF' // darkest indigo
    case 'document': return '#7F9CF5' // light indigo
    case 'chart': return '#4C51BF' // darkest indigo
    case 'church': return '#744210' // dark yellow
    case 'translate': return '#975A16' // medium yellow
    case 'hotel': return '#B7791F' // light yellow
    case 'cap': return '#F6AD55' // light orange
    case 'book': return '#9C4221' // dark orange
    case 'pharmacy': return '#E53E3E' // red
    case 'cart': return '#C05621' // dark orange
    
    // Default
    default: return '#A0AEC0' // default gray
  }
}

export default function ForceGraph() {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!svgRef.current) return

    // Clear any existing SVG content
    d3.select(svgRef.current).selectAll('*').remove()

    // Get dimensions
    const width = window.innerWidth
    const height = window.innerHeight

    // Create the SVG container
    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)

    // Create a group for links that will be rendered first (below nodes)
    const linkGroup = svg.append('g')
      .attr('class', 'links')

    // Create a group for nodes that will be rendered second (above links)
    const nodeGroup = svg.append('g')
      .attr('class', 'nodes')

    // Create defs for gradients
    const defs = svg.append('defs')

    // Initialize node counter for unique IDs
    let nextNodeId = 0
    
    // Initialize arrays to store all nodes and links
    const nodes: Node[] = []
    const links: Link[] = []
    
    // Track active clusters
    const activeClusters = new Set<number>()
    
    // Available icon types for tools (excluding user and robot)
    const toolIcons = [
      'tools', 'server', 'database', 'globe', 'chart', 'mobile', 
      'cloud', 'api', 'display', 'chatbot', 'map', 'camera', 
      'car', 'document', 'search', 'microphone', 'calendar', 
      'tree', 'waves', 'health', 'map-marker', 'cart', 'church', 
      'translate', 'image', 'heart', 'hotel', 'train', 'cap', 
      'bus', 'shield', 'wifi', 'controller', 'satellite', 
      'fingerprint', 'lock', 'healthcare', 'airplane', 'book', 
      'cross', 'plane', 'money', 'bank', 'utensils', 'currency', 
      'pharmacy', 'hospital', 'construction', 'weather', 'mountain', 
      'dog', 'cat', 'bird', 'chef-hat', 'dumbbells', 'idea', 'star'
    ]
    
    // Function to create a random position on the screen
    const getRandomPosition = () => {
      // Keep positions away from the edges
      const margin = 100
      return {
        x: margin + Math.random() * (width - 2 * margin),
        y: margin + Math.random() * (height - 2 * margin)
      }
    }
    
    // Function to create a new cluster
    const createCluster = () => {
      const clusterId = Math.floor(Math.random() * 10000) // Random cluster ID
      activeClusters.add(clusterId)
      
      const clusterCenter = getRandomPosition()
      
      // Create 1-2 user nodes
      const userCount = Math.floor(Math.random() * 2) + 1
      const userNodes: Node[] = []
      
      for (let i = 0; i < userCount; i++) {
        const userNode: Node = {
          id: nextNodeId++,
          icon: 'user',
          clusterId,
          isCore: true,
          x: clusterCenter.x + (Math.random() - 0.5) * 50,
          y: clusterCenter.y + (Math.random() - 0.5) * 50
        }
        userNodes.push(userNode)
        nodes.push(userNode)
      }
      
      // Create 1-3 robot nodes
      const robotCount = Math.floor(Math.random() * 3) + 1
      const robotNodes: Node[] = []
      
      for (let i = 0; i < robotCount; i++) {
        const robotNode: Node = {
          id: nextNodeId++,
          icon: Math.random() > 0.5 ? 'robot' : 'ai',
          clusterId,
          isCore: true,
          x: clusterCenter.x + (Math.random() - 0.5) * 100,
          y: clusterCenter.y + (Math.random() - 0.5) * 100
        }
        robotNodes.push(robotNode)
        nodes.push(robotNode)
      }
      
      // Create 5-8 tool nodes
      const toolCount = Math.floor(Math.random() * 4) + 5 // 5-8 tools
      const toolNodes: Node[] = []
      
      // Shuffle tool icons and pick a subset
      const shuffledTools = [...toolIcons].sort(() => Math.random() - 0.5).slice(0, toolCount)
      
      for (let i = 0; i < toolCount; i++) {
        const toolNode: Node = {
          id: nextNodeId++,
          icon: shuffledTools[i],
          clusterId,
          x: clusterCenter.x + (Math.random() - 0.5) * 150,
          y: clusterCenter.y + (Math.random() - 0.5) * 150
        }
        toolNodes.push(toolNode)
        nodes.push(toolNode)
      }
      
      // Create initial connections
      
      // Connect users to robots
      userNodes.forEach(user => {
        robotNodes.forEach(robot => {
          links.push({
            source: user.id,
            target: robot.id,
            clusterId
          })
        })
      })
      
      // Connect robots to some tools
      robotNodes.forEach(robot => {
        // Each robot connects to 2-4 random tools
        const toolsToConnect = Math.floor(Math.random() * 3) + 2
        const shuffledToolNodes = [...toolNodes].sort(() => Math.random() - 0.5)
        
        for (let i = 0; i < Math.min(toolsToConnect, shuffledToolNodes.length); i++) {
          links.push({
            source: robot.id,
            target: shuffledToolNodes[i].id,
            clusterId
          })
        }
      })
      
      // Connect robots to each other
      if (robotNodes.length > 1) {
        for (let i = 0; i < robotNodes.length - 1; i++) {
          links.push({
            source: robotNodes[i].id,
            target: robotNodes[i + 1].id,
            clusterId
          })
        }
      }
      
      // Connect some tools to each other
      if (toolNodes.length > 1) {
        const connectionCount = Math.floor(Math.random() * 3) + 1 // 1-3 connections
        for (let i = 0; i < connectionCount; i++) {
          const source = toolNodes[Math.floor(Math.random() * toolNodes.length)]
          const target = toolNodes[Math.floor(Math.random() * toolNodes.length)]
          
          if (source.id !== target.id) {
            links.push({
              source: source.id,
              target: target.id,
              clusterId
            })
          }
        }
      }
      
      // Assign colors to nodes
      nodes.forEach(node => {
        if (!node.color) {
          node.color = getIconColor(node.icon)
        }
      })
      
      return clusterId
    }
    
    // Function to remove a cluster
    const removeCluster = (clusterId: number) => {
      // Find all nodes in this cluster
      const clusterNodeIds = nodes
        .filter(node => node.clusterId === clusterId)
        .map(node => node.id)
      
      // Remove all links in this cluster
      for (let i = links.length - 1; i >= 0; i--) {
        if (links[i].clusterId === clusterId) {
          links.splice(i, 1)
        }
      }
      
      // Remove all nodes in this cluster
      for (let i = nodes.length - 1; i >= 0; i--) {
        if (nodes[i].clusterId === clusterId) {
          nodes.splice(i, 1)
        }
      }
      
      activeClusters.delete(clusterId)
    }
    
    // Function to add a new connection to a cluster
    const addConnectionToCluster = (clusterId: number) => {
      const clusterNodes = nodes.filter(node => node.clusterId === clusterId)
      
      if (clusterNodes.length < 2) return
      
      // Pick two random nodes from the cluster
      const randomIndex1 = Math.floor(Math.random() * clusterNodes.length)
      let randomIndex2 = Math.floor(Math.random() * clusterNodes.length)
      
      // Make sure we don't pick the same node twice
      while (randomIndex1 === randomIndex2) {
        randomIndex2 = Math.floor(Math.random() * clusterNodes.length)
      }
      
      const source = clusterNodes[randomIndex1]
      const target = clusterNodes[randomIndex2]
      
      // Check if this connection already exists
      const connectionExists = links.some(link => 
        (link.source === source.id && link.target === target.id) ||
        (link.source === target.id && link.target === source.id)
      )
      
      if (!connectionExists) {
        links.push({
          source: source.id,
          target: target.id,
          clusterId
        })
      }
    }
    
    // Function to remove connections from a cluster
    const removeConnectionsFromCluster = (clusterId: number, count: number) => {
      const clusterLinks = links.filter(link => link.clusterId === clusterId)
      
      if (clusterLinks.length <= count) return
      
      // Remove random connections
      for (let i = 0; i < count; i++) {
        if (clusterLinks.length === 0) break
        
        const randomIndex = Math.floor(Math.random() * clusterLinks.length)
        const linkToRemove = clusterLinks[randomIndex]
        
        // Find and remove this link from the main links array
        const mainIndex = links.findIndex(
          link => link.source === linkToRemove.source && link.target === linkToRemove.target
        )
        
        if (mainIndex !== -1) {
          links.splice(mainIndex, 1)
        }
        
        // Remove from our tracking array too
        clusterLinks.splice(randomIndex, 1)
      }
    }
    
    // Create initial clusters
    for (let i = 0; i < 5; i++) {
      createCluster()
    }
    
    // Create a simulation with forces
    const simulation = d3.forceSimulation<Node>(nodes)
      .force('link', d3.forceLink<Node, Link>(links).id(d => d.id).distance(100))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(40))
      .force('x', d3.forceX(width / 2).strength(0.01))
      .force('y', d3.forceY(height / 2).strength(0.01))
      .alphaTarget(0.1)
      .alphaDecay(0.02)
    
    // Function to update the visualization
    const updateVisualization = () => {
      // Update links
      const link = linkGroup.selectAll('line')
        .data(links, (d: any) => `${d.source}-${d.target}`)
      
      // Remove old links
      link.exit().remove()
      
      // Add new links
      const linkEnter = link.enter().append('line')
        .attr('class', 'link')
        .style('stroke', (d: any) => {
          const source = typeof d.source === 'object' ? d.source : nodes.find(n => n.id === d.source)
          const target = typeof d.target === 'object' ? d.target : nodes.find(n => n.id === d.target)
          
          if (!source || !target) return '#ccc'
          
          // Use a gradient of the two node colors, or default to a light gray
          return source.color && target.color ? 
            `url(#gradient-${source.id}-${target.id})` : 
            '#ccc'
        })
        .style('stroke-opacity', 0.3)
        .style('stroke-width', 3)
      
      // Merge enter and update selections
      const linkMerge = linkEnter.merge(link as any)
      
      // Update gradients
      defs.selectAll('*').remove()
      
      links.forEach((d: any) => {
        const source = typeof d.source === 'object' ? d.source : nodes.find(n => n.id === d.source)
        const target = typeof d.target === 'object' ? d.target : nodes.find(n => n.id === d.target)
        
        if (!source || !target) return
        
        if (source.color && target.color) {
          const gradient = defs.append('linearGradient')
            .attr('id', `gradient-${source.id}-${target.id}`)
            .attr('gradientUnits', 'userSpaceOnUse')
            .attr('x1', source.x || 0)
            .attr('y1', source.y || 0)
            .attr('x2', target.x || 0)
            .attr('y2', target.y || 0)
            
          gradient.append('stop')
            .attr('offset', '0%')
            .attr('stop-color', source.color)
            .attr('stop-opacity', 0.6)
            
          gradient.append('stop')
            .attr('offset', '100%')
            .attr('stop-color', target.color)
            .attr('stop-opacity', 0.6)
        }
      })
      
      // Update nodes
      const node = nodeGroup.selectAll('.node-group')
        .data(nodes, (d: any) => d.id)
      
      // Remove old nodes
      node.exit().remove()
      
      // Add new nodes
      const nodeEnter = node.enter().append('g')
        .attr('class', 'node-group')
        .call(d3.drag<SVGGElement, Node>()
          .on('start', dragstarted)
          .on('drag', dragged)
          .on('end', dragended) as any)
      
      // Add circles to each node
      nodeEnter.append('circle')
        .attr('class', 'node')
        .attr('r', d => d.isCore ? 30 : 25)
        .style('fill', d => d.color ? `${d.color}15` : '#f0f0f015')
        .style('fill-opacity', 0.15)
        .style('stroke', d => d.color ? d.color : '#ddd')
        .style('stroke-opacity', d => d.isCore ? 0.3 : 0.2)
        .style('stroke-width', d => d.isCore ? 1.5 : 1)
        .style('cursor', 'grab')
        .style('filter', 'drop-shadow(0px 0px 3px rgba(255, 255, 255, 0.1))')
      
      // Add a subtle glow effect
      nodeEnter.append('circle')
        .attr('r', d => d.isCore ? 33 : 28)
        .style('fill', 'none')
        .style('stroke', d => d.color ? d.color : '#ddd')
        .style('stroke-opacity', d => d.isCore ? 0.08 : 0.05)
        .style('stroke-width', 3)
        .style('filter', 'blur(3px)')
      
      // Add icons to each node
      nodeEnter.each(function(d) {
        const iconGroup = d3.select(this)
        
        // Create a foreignObject to embed React Icons
        const fo = iconGroup.append('foreignObject')
          .attr('width', 40)
          .attr('height', 40)
          .attr('x', -20)
          .attr('y', -20)
          .style('pointer-events', 'none')
        
        // Create a div inside the foreignObject
        const div = fo.append('xhtml:div')
          .style('width', '100%')
          .style('height', '100%')
          .style('display', 'flex')
          .style('align-items', 'center')
          .style('justify-content', 'center')
        
        // Create a div for the icon
        const iconElement = document.createElement('div')
        iconElement.style.color = d.color || 'rgba(85, 85, 85, 0.2)'
        iconElement.style.fontSize = d.isCore ? '24px' : '22px'
        iconElement.style.opacity = d.isCore ? '0.5' : '0.4'
        
        // Map icon names to React Icons components
        let iconSvg
        switch(d.icon) {
          case 'database':
            iconSvg = renderToStaticMarkup(<FaDatabase />)
            break
          case 'calendar':
            iconSvg = renderToStaticMarkup(<FaCalendar />)
            break
          case 'tools':
            iconSvg = renderToStaticMarkup(<FaTools />)
            break
          case 'globe':
            iconSvg = renderToStaticMarkup(<FaGlobe />)
            break
          case 'robot':
            iconSvg = renderToStaticMarkup(<FaRobot />)
            break
          case 'server':
            iconSvg = renderToStaticMarkup(<FaServer />)
            break
          case 'chart':
            iconSvg = renderToStaticMarkup(<FaChartLine />)
            break
          case 'user':
            iconSvg = renderToStaticMarkup(<FaUser />)
            break
          case 'mobile':
            iconSvg = renderToStaticMarkup(<FaMobile />)
            break
          case 'cloud':
            iconSvg = renderToStaticMarkup(<FaCloud />)
            break
          case 'api':
            iconSvg = renderToStaticMarkup(<FaCode />)
            break
          case 'display':
            iconSvg = renderToStaticMarkup(<FaDesktop />)
            break
          case 'chatbot':
            iconSvg = renderToStaticMarkup(<FaComments />)
            break
          case 'map':
            iconSvg = renderToStaticMarkup(<FaMap />)
            break
          case 'camera':
            iconSvg = renderToStaticMarkup(<FaCamera />)
            break
          case 'car':
            iconSvg = renderToStaticMarkup(<FaCar />)
            break
          case 'users':
            iconSvg = renderToStaticMarkup(<FaUsers />)
            break
          case 'document':
            iconSvg = renderToStaticMarkup(<FaFileAlt />)
            break
          case 'search':
            iconSvg = renderToStaticMarkup(<FaSearch />)
            break
          case 'microphone':
            iconSvg = renderToStaticMarkup(<FaMicrophone />)
            break
          case 'tree':
            iconSvg = renderToStaticMarkup(<FaTree />)
            break
          case 'waves':
            iconSvg = renderToStaticMarkup(<FaWater />)
            break
          case 'health':
            iconSvg = renderToStaticMarkup(<FaHeartbeat />)
            break
          case 'map-marker':
            iconSvg = renderToStaticMarkup(<FaMapMarkerAlt />)
            break
          case 'cart':
            iconSvg = renderToStaticMarkup(<FaShoppingCart />)
            break
          case 'church':
            iconSvg = renderToStaticMarkup(<FaChurch />)
            break
          case 'translate':
            iconSvg = renderToStaticMarkup(<FaLanguage />)
            break
          case 'image':
            iconSvg = renderToStaticMarkup(<FaImage />)
            break
          case 'heart':
            iconSvg = renderToStaticMarkup(<FaHeart />)
            break
          case 'hotel':
            iconSvg = renderToStaticMarkup(<FaHotel />)
            break
          case 'train':
            iconSvg = renderToStaticMarkup(<FaTrain />)
            break
          case 'cap':
            iconSvg = renderToStaticMarkup(<FaGraduationCap />)
            break
          case 'bus':
            iconSvg = renderToStaticMarkup(<FaBus />)
            break
          case 'shield':
            iconSvg = renderToStaticMarkup(<FaShieldAlt />)
            break
          case 'wifi':
            iconSvg = renderToStaticMarkup(<FaWifi />)
            break
          case 'controller':
            iconSvg = renderToStaticMarkup(<FaGamepad />)
            break
          case 'satellite':
            iconSvg = renderToStaticMarkup(<FaSatellite />)
            break
          case 'fingerprint':
            iconSvg = renderToStaticMarkup(<FaFingerprint />)
            break
          case 'lock':
            iconSvg = renderToStaticMarkup(<FaLock />)
            break
          case 'healthcare':
            iconSvg = renderToStaticMarkup(<FaHospital />)
            break
          case 'airplane':
            iconSvg = renderToStaticMarkup(<FaPlane />)
            break
          case 'book':
            iconSvg = renderToStaticMarkup(<FaBook />)
            break
          case 'cross':
            iconSvg = renderToStaticMarkup(<FaCross />)
            break
          case 'plane':
            iconSvg = renderToStaticMarkup(<FaPlane />)
            break
          case 'money':
            iconSvg = renderToStaticMarkup(<FaMoneyBill />)
            break
          case 'bank':
            iconSvg = renderToStaticMarkup(<FaUniversity />)
            break
          case 'utensils':
            iconSvg = renderToStaticMarkup(<FaUtensils />)
            break
          case 'currency':
            iconSvg = renderToStaticMarkup(<FaDollarSign />)
            break
          case 'pharmacy':
            iconSvg = renderToStaticMarkup(<FaPrescriptionBottleAlt />)
            break
          case 'hospital':
            iconSvg = renderToStaticMarkup(<FaHospital />)
            break
          case 'construction':
            iconSvg = renderToStaticMarkup(<FaHardHat />)
            break
          case 'weather':
            iconSvg = renderToStaticMarkup(<FaCloudSun />)
            break
          case 'mountain':
            iconSvg = renderToStaticMarkup(<FaMountain />)
            break
          case 'dog':
            iconSvg = renderToStaticMarkup(<FaDog />)
            break
          case 'cat':
            iconSvg = renderToStaticMarkup(<FaCat />)
            break
          case 'bird':
            iconSvg = renderToStaticMarkup(<FaDove />)
            break
          case 'chef-hat':
            iconSvg = renderToStaticMarkup(<FaUtensils />)  // Using utensils as substitute
            break
          case 'dumbbells':
            iconSvg = renderToStaticMarkup(<FaDumbbell />)
            break
          case 'idea':
            iconSvg = renderToStaticMarkup(<FaLightbulb />)
            break
          case 'star':
            iconSvg = renderToStaticMarkup(<FaStar />)
            break
          case 'facebook':
            iconSvg = renderToStaticMarkup(<FaFacebook />)
            break
          case 'github':
            iconSvg = renderToStaticMarkup(<FaGithub />)
            break
          case 'tiktok':
            iconSvg = renderToStaticMarkup(<FaTiktok />)
            break
          case 'twitter':
            iconSvg = renderToStaticMarkup(<FaTwitter />)
            break
          case 'ai':
            iconSvg = renderToStaticMarkup(<FaRobot />)  // Using robot icon for AI
            break
          case 'google':
            iconSvg = renderToStaticMarkup(<FaGoogle />)
            break
          case 'linkedin':
            iconSvg = renderToStaticMarkup(<FaLinkedin />)
            break
          case 'instagram':
            iconSvg = renderToStaticMarkup(<FaInstagram />)
            break
          default:
            iconSvg = renderToStaticMarkup(<FaGlobe />)
        }
        
        iconElement.innerHTML = iconSvg
        const divNode = div.node() as HTMLElement
        if (divNode) {
          divNode.appendChild(iconElement)
        }
      })
      
      // Merge enter and update selections
      const nodeMerge = nodeEnter.merge(node as any)
      
      // Update the simulation on tick
      simulation.on('tick', () => {
        // Update gradients as nodes move
        links.forEach((d: any) => {
          const source = typeof d.source === 'object' ? d.source : nodes.find(n => n.id === d.source)
          const target = typeof d.target === 'object' ? d.target : nodes.find(n => n.id === d.target)
          
          if (!source || !target) return
          
          if (source.color && target.color) {
            svg.select(`#gradient-${source.id}-${target.id}`)
              .attr('x1', source.x || 0)
              .attr('y1', source.y || 0)
              .attr('x2', target.x || 0)
              .attr('y2', target.y || 0)
          }
        })
        
        // Calculate line endpoints to stop at node boundaries
        linkMerge
          .attr('x1', (d: any) => {
            const source = typeof d.source === 'object' ? d.source : nodes.find(n => n.id === d.source)
            const target = typeof d.target === 'object' ? d.target : nodes.find(n => n.id === d.target)
            
            if (!source || !target) return 0
            
            // Get the direction vector
            const dx = target.x! - source.x!
            const dy = target.y! - source.y!
            const dr = Math.sqrt(dx * dx + dy * dy)
            
            // If nodes are on top of each other, just return the source position
            if (dr === 0) return source.x!
            
            // Calculate the point on the edge of the source node
            const radius = source.isCore ? 30 : 25
            return source.x! + dx * radius / dr
          })
          .attr('y1', (d: any) => {
            const source = typeof d.source === 'object' ? d.source : nodes.find(n => n.id === d.source)
            const target = typeof d.target === 'object' ? d.target : nodes.find(n => n.id === d.target)
            
            if (!source || !target) return 0
            
            const dx = target.x! - source.x!
            const dy = target.y! - source.y!
            const dr = Math.sqrt(dx * dx + dy * dy)
            
            if (dr === 0) return source.y!
            
            const radius = source.isCore ? 30 : 25
            return source.y! + dy * radius / dr
          })
          .attr('x2', (d: any) => {
            const source = typeof d.source === 'object' ? d.source : nodes.find(n => n.id === d.source)
            const target = typeof d.target === 'object' ? d.target : nodes.find(n => n.id === d.target)
            
            if (!source || !target) return 0
            
            const dx = source.x! - target.x!
            const dy = source.y! - target.y!
            const dr = Math.sqrt(dx * dx + dy * dy)
            
            if (dr === 0) return target.x!
            
            const radius = target.isCore ? 30 : 25
            return target.x! + dx * radius / dr
          })
          .attr('y2', (d: any) => {
            const source = typeof d.source === 'object' ? d.source : nodes.find(n => n.id === d.source)
            const target = typeof d.target === 'object' ? d.target : nodes.find(n => n.id === d.target)
            
            if (!source || !target) return 0
            
            const dx = source.x! - target.x!
            const dy = source.y! - target.y!
            const dr = Math.sqrt(dx * dx + dy * dy)
            
            if (dr === 0) return target.y!
            
            const radius = target.isCore ? 30 : 25
            return target.y! + dy * radius / dr
          })
        
        nodeMerge
          .attr('transform', d => `translate(${d.x}, ${d.y})`)
      })
      
      // Update the simulation with new nodes and links
      simulation.nodes(nodes)
      simulation.force('link', d3.forceLink<Node, Link>(links).id(d => d.id).distance(100))
      simulation.alpha(0.3).restart()
    }
    
    // Initial visualization update
    updateVisualization()
    
    // Function to evolve the network
    const evolveNetwork = () => {
      // For each active cluster
      activeClusters.forEach(clusterId => {
        // Add a new connection
        addConnectionToCluster(clusterId)
        
        // Remove 2 connections
        removeConnectionsFromCluster(clusterId, 2)
      })
      
      // Randomly remove a cluster and create a new one
      if (Math.random() < 0.1) { // 10% chance each second
        if (activeClusters.size > 0) {
          // Pick a random cluster to remove
          const clusterArray = Array.from(activeClusters)
          const clusterToRemove = clusterArray[Math.floor(Math.random() * clusterArray.length)]
          
          removeCluster(clusterToRemove)
          createCluster()
        }
      }
      
      // Ensure we always have 5 clusters
      while (activeClusters.size < 5) {
        createCluster()
      }
      
      // Update the visualization
      updateVisualization()
    }
    
    // Evolve the network every second
    const evolutionInterval = setInterval(evolveNetwork, 1000)
    
    // Drag functions
    function dragstarted(event: d3.D3DragEvent<SVGGElement, Node, Node>) {
      if (!event.active) simulation.alphaTarget(0.3).restart()
      event.subject.fx = event.subject.x
      event.subject.fy = event.subject.y
    }
    
    function dragged(event: d3.D3DragEvent<SVGGElement, Node, Node>) {
      event.subject.fx = event.x
      event.subject.fy = event.y
    }
    
    function dragended(event: d3.D3DragEvent<SVGGElement, Node, Node>) {
      if (!event.active) simulation.alphaTarget(0)
      event.subject.fx = null
      event.subject.fy = null
    }
    
    // Handle window resize
    const handleResize = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      
      svg.attr('width', width).attr('height', height)
      simulation.force('center', d3.forceCenter(width / 2, height / 2))
      simulation.alpha(0.3).restart()
    }
    
    window.addEventListener('resize', handleResize)
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize)
      simulation.stop()
      clearInterval(evolutionInterval)
    }
  }, [])

  return (
    <svg 
      ref={svgRef} 
      style={{ 
        width: '100%', 
        height: '100vh', 
        display: 'block',
        background: 'transparent'
      }}
    />
  )
} 