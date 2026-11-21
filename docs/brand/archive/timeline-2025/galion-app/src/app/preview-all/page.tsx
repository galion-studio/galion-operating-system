'use client';

/**
 * GALION Component Gallery - Preview All Components
 *
 * A comprehensive showcase of 120+ components from the galion-app ecosystem.
 * Organized into categories with search, filter, and fullscreen preview capabilities.
 *
 * @version 1.0.0
 * @lastUpdated 2026-01-14
 */

import React, { useState, useCallback, useEffect, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import {
  Search,
  Maximize2,
  Minimize2,
  RefreshCw,
  Play,
  Pause,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Zap,
  Box,
  Mic,
  MessageSquare,
  Settings,
  Shield,
  Layout,
  Layers,
  Monitor,
  Cpu,
  Database,
  Code,
  Palette,
  Eye,
  Star,
  X,
  Info,
  ExternalLink,
  Grid3X3,
  List,
  Filter,
  Tag,
} from 'lucide-react';

// ============================================================================
// DYNAMIC IMPORTS - All components loaded with ssr: false for 3D/WebGL support
// ============================================================================

// BOOT SEQUENCES (15 components)
const GalionUltimateBoot = dynamic(() => import('@/components/boot/GalionUltimateBoot').then(m => ({ default: m.GalionUltimateBoot })), { ssr: false });
const BirthOfAStar = dynamic(() => import('@/components/boot/BirthOfAStar').then(m => ({ default: m.BirthOfAStar })), { ssr: false });
const GalionOSBootV7 = dynamic(() => import('@/components/boot/orb-v7/GalionOSBootV7').then(m => ({ default: m.GalionOSBootV7 })), { ssr: false });
const GalionOrbV7 = dynamic(() => import('@/components/boot/orb-v7/GalionOrbV7').then(m => ({ default: m.GalionOrbV7 })), { ssr: false });
const GalionOrbV7Enhanced = dynamic(() => import('@/components/boot/orb-v7/GalionOrbV7Enhanced').then(m => ({ default: m.GalionOrbV7Enhanced })), { ssr: false });
const GalionOSBootV3 = dynamic(() => import('@/components/boot/GalionOSBootV3').then(m => ({ default: m.GalionOSBootV3 })), { ssr: false });
const GalionOSBootV2 = dynamic(() => import('@/components/boot/GalionOSBootV2').then(m => ({ default: m.GalionOSBootV2 })), { ssr: false });
const EnhancedGalionOSBoot = dynamic(() => import('@/components/boot/EnhancedGalionOSBoot').then(m => ({ default: m.EnhancedGalionOSBoot })), { ssr: false });
const GalionOSBootV542 = dynamic(() => import('@/components/boot/GalionOSBootV542').then(m => ({ default: m.default })), { ssr: false });
const UnifiedBootSequence = dynamic(() => import('@/components/boot/UnifiedBootSequence').then(m => ({ default: m.UnifiedBootSequence })), { ssr: false });
const WakeUp = dynamic(() => import('@/components/boot/WakeUp').then(m => ({ default: m.WakeUp })), { ssr: false });
const WelcomeQuestions = dynamic(() => import('@/components/boot/WelcomeQuestions').then(m => ({ default: m.WelcomeQuestions })), { ssr: false });
const FirstInteractionCelebration = dynamic(() => import('@/components/boot/FirstInteractionCelebration').then(m => ({ default: m.FirstInteractionCelebration })), { ssr: false });
const BootErrorBoundary = dynamic(() => import('@/components/boot/BootErrorBoundary').then(m => ({ default: m.BootErrorBoundary })), { ssr: false });
const LottieBootAnimation = dynamic(() => import('@/components/boot/LottieBootAnimation').then(m => ({ default: m.default })), { ssr: false });

// BOOT PHASES (9 components)
const ConsentPhase = dynamic(() => import('@/components/boot/phases/ConsentPhase').then(m => ({ default: m.default })), { ssr: false });
const BirthPhase = dynamic(() => import('@/components/boot/phases/BirthPhase').then(m => ({ default: m.default })), { ssr: false });
const WelcomePhase = dynamic(() => import('@/components/boot/phases/WelcomePhase').then(m => ({ default: m.default })), { ssr: false });
const WakePhase = dynamic(() => import('@/components/boot/phases/WakePhase').then(m => ({ default: m.default })), { ssr: false });
const GreetingPhase = dynamic(() => import('@/components/boot/phases/GreetingPhase').then(m => ({ default: m.default })), { ssr: false });
const GalionBootPhase = dynamic(() => import('@/components/boot/phases/GalionBootPhase').then(m => ({ default: m.default })), { ssr: false });
const OrbingPhase = dynamic(() => import('@/components/boot/phases/OrbingPhase').then(m => ({ default: m.default })), { ssr: false });
const SystemBootPhase = dynamic(() => import('@/components/boot/phases/SystemBootPhase').then(m => ({ default: m.default })), { ssr: false });
const VoidPhase = dynamic(() => import('@/components/boot/phases/VoidPhase').then(m => ({ default: m.default })), { ssr: false });

// V7 ORB COMPONENTS (6 components)
const OrbPlasmaCore = dynamic(() => import('@/components/boot/orb-v7/core/OrbPlasmaCore').then(m => ({ default: m.default })), { ssr: false });
const OrbGlassSurfaceV7 = dynamic(() => import('@/components/boot/orb-v7/core/OrbGlassSurface').then(m => ({ default: m.default })), { ssr: false });
const OrbParticleField = dynamic(() => import('@/components/boot/orb-v7/effects/OrbParticleField').then(m => ({ default: m.default })), { ssr: false });
const OrbEnergyRings = dynamic(() => import('@/components/boot/orb-v7/effects/OrbEnergyRings').then(m => ({ default: m.default })), { ssr: false });
const OrbLightningTendrils = dynamic(() => import('@/components/boot/orb-v7/effects/OrbLightningTendrils').then(m => ({ default: m.default })), { ssr: false });
const OrbBirthSequence = dynamic(() => import('@/components/boot/orb-v7/birth/OrbBirthSequence').then(m => ({ default: m.OrbBirthSequence })), { ssr: false });

// COSMOS BACKGROUNDS (2 components)
const CosmosBackground = dynamic(() => import('@/components/boot/cosmos/CosmosBackground').then(m => ({ default: m.default })), { ssr: false });
const CosmicBackground = dynamic(() => import('@/components/boot/orb-v7/background/CosmicBackground').then(m => ({ default: m.default })), { ssr: false });

// GATEKEEPER (5 components)
const GalionGatekeeperV2 = dynamic(() => import('@/components/gatekeeper/GalionGatekeeperV2').then(m => ({ default: m.GalionGatekeeperV2 })), { ssr: false });
const GalionOSBootGatekeeper = dynamic(() => import('@/components/gatekeeper/GalionOSBoot').then(m => ({ default: m.GalionOSBoot })), { ssr: false });
const WelcomeScreen = dynamic(() => import('@/components/gatekeeper/WelcomeScreen').then(m => ({ default: m.WelcomeScreen })), { ssr: false });
const WelcomeBack = dynamic(() => import('@/components/gatekeeper/WelcomeBack').then(m => ({ default: m.WelcomeBack })), { ssr: false });
const WelcomeBackV2 = dynamic(() => import('@/components/gatekeeper/WelcomeBackV2').then(m => ({ default: m.WelcomeBackV2 })), { ssr: false });

// WORKSPACE3D ORBS (20+ components)
const GalionOrbV3 = dynamic(() => import('@/components/workspace3d/orb/GalionOrbV3').then(m => ({ default: m.GalionOrbV3 })), { ssr: false });
const GalionOrbV5 = dynamic(() => import('@/components/workspace3d/orb/v5/GalionOrbV5').then(m => ({ default: m.GalionOrbV5 })), { ssr: false });
const GalionOrbV6 = dynamic(() => import('@/components/workspace3d/orb/v6/GalionOrbV6').then(m => ({ default: m.GalionOrbV6 })), { ssr: false });
// GalionOrbComplete removed - component does not exist
const GalionOrbAdvanced = dynamic(() => import('@/components/workspace3d/orb/GalionOrbAdvanced').then(m => ({ default: m.default })), { ssr: false });
const MobileOrbV3 = dynamic(() => import('@/components/workspace3d/orb/MobileOrbV3').then(m => ({ default: m.MobileOrbV3 })), { ssr: false });
const OrbDemoController = dynamic(() => import('@/components/workspace3d/orb/OrbDemoController').then(m => ({ default: m.OrbDemoController })), { ssr: false });
const OrbInnerUniverse = dynamic(() => import('@/components/workspace3d/orb/OrbInnerUniverse').then(m => ({ default: m.OrbInnerUniverse })), { ssr: false });

// JARVIS/IRON MAN ORBS (13 components)
const IronManJarvisOrb = dynamic(() => import('@/components/workspace3d/orb/IronManJarvisOrb').then(m => ({ default: m.IronManJarvisOrb })), { ssr: false });
const IronManJarvisOrbAdvanced = dynamic(() => import('@/components/workspace3d/orb/IronManJarvisOrbAdvanced').then(m => ({ default: m.IronManJarvisOrbAdvanced })), { ssr: false });
const IronManJarvisOrbMovieAccurate = dynamic(() => import('@/components/workspace3d/orb/IronManJarvisOrbMovieAccurate').then(m => ({ default: m.IronManJarvisOrbMovieAccurate })), { ssr: false });
const IronManJarvisHologram2008 = dynamic(() => import('@/components/workspace3d/orb/IronManJarvisHologram2008').then(m => ({ default: m.IronManJarvisHologram2008 })), { ssr: false });
const IronManJarvisHologram2008Simple = dynamic(() => import('@/components/workspace3d/orb/IronManJarvisHologram2008Simple').then(m => ({ default: m.IronManJarvisHologram2008Simple })), { ssr: false });
const JarvisNexusCore = dynamic(() => import('@/components/workspace3d/orb/JarvisNexusCore').then(m => ({ default: m.JarvisNexusCore })), { ssr: false });
const JarvisOrb = dynamic(() => import('@/components/workspace3d/orb/JarvisOrb').then(m => ({ default: m.JarvisOrb })), { ssr: false });
const JarvisOrbHUD = dynamic(() => import('@/components/workspace3d/orb/JarvisOrbHUD').then(m => ({ default: m.JarvisOrbHUD })), { ssr: false });
const JarvisVoiceWaveform = dynamic(() => import('@/components/workspace3d/orb/JarvisVoiceWaveform').then(m => ({ default: m.JarvisVoiceWaveform })), { ssr: false });
const JarvisNeuralNetwork = dynamic(() => import('@/components/workspace3d/orb/JarvisNeuralNetwork').then(m => ({ default: m.JarvisNeuralNetwork })), { ssr: false });
const JarvisControls = dynamic(() => import('@/components/workspace3d/orb/JarvisControls').then(m => ({ default: m.default })), { ssr: false });

// VOICE COMPONENTS (12 components)
const VoiceOrb = dynamic(() => import('@/components/voice/VoiceOrb').then(m => ({ default: m.VoiceOrb })), { ssr: false });
const VoiceOrb3D = dynamic(() => import('@/components/voice/VoiceOrb3D').then(m => ({ default: m.default })), { ssr: false });
const VoiceOrbV542 = dynamic(() => import('@/components/voice/VoiceOrbV542').then(m => ({ default: m.default })), { ssr: false });
const VoiceOrbWebSocket = dynamic(() => import('@/components/voice/VoiceOrbWebSocket').then(m => ({ default: m.VoiceOrbWebSocket })), { ssr: false });
const VoiceAIInterface = dynamic(() => import('@/components/voice/VoiceAIInterface').then(m => ({ default: m.VoiceAIInterface })), { ssr: false });
const VoiceInterfaceV52 = dynamic(() => import('@/components/voice/VoiceInterfaceV52').then(m => ({ default: m.default })), { ssr: false });
const VoiceInterfaceV54 = dynamic(() => import('@/components/voice/VoiceInterfaceV54').then(m => ({ default: m.default })), { ssr: false });
const VoiceDashboardPanel = dynamic(() => import('@/components/voice/VoiceDashboardPanel').then(m => ({ default: m.default })), { ssr: false });
const VoiceControls = dynamic(() => import('@/components/voice/VoiceControls').then(m => ({ default: m.VoiceControls })), { ssr: false });
const VoiceSettings = dynamic(() => import('@/components/voice/VoiceSettings').then(m => ({ default: m.default })), { ssr: false });
const ModelSelector = dynamic(() => import('@/components/voice/ModelSelector').then(m => ({ default: m.default })), { ssr: false });
const VoiceCustomization = dynamic(() => import('@/components/voice/VoiceCustomization').then(m => ({ default: m.VoiceCustomization })), { ssr: false });
const ConversationDisplay = dynamic(() => import('@/components/voice/ConversationDisplay').then(m => ({ default: m.ConversationDisplay })), { ssr: false });
const RealTimeTranscript = dynamic(() => import('@/components/voice/RealTimeTranscript').then(m => ({ default: m.RealTimeTranscript })), { ssr: false });
const AudioWaveform = dynamic(() => import('@/components/voice/AudioWaveform').then(m => ({ default: m.AudioWaveform })), { ssr: false });
const EmotionIndicator = dynamic(() => import('@/components/voice/EmotionIndicator').then(m => ({ default: m.EmotionIndicator })), { ssr: false });

// GLASS COMPONENTS (12 components)
const GlassPanel = dynamic(() => import('@/components/shared/GlassPanel').then(m => ({ default: m.GlassPanel })), { ssr: false });
const GlassCard = dynamic(() => import('@/components/shared/GlassCard').then(m => ({ default: m.GlassCard })), { ssr: false });
const GlassButton = dynamic(() => import('@/components/shared/GlassButton').then(m => ({ default: m.GlassButton })), { ssr: false });
const GlassToolbar = dynamic(() => import('@/components/shared/GlassToolbar').then(m => ({ default: m.GlassToolbar })), { ssr: false });

// PREMIUM COMPONENTS (6 components)
const GoldenRatioCard = dynamic(() => import('@/components/premium/GoldenRatioCard').then(m => ({ default: m.GoldenRatioCard })), { ssr: false });
const GoldenRatioGrid = dynamic(() => import('@/components/premium/GoldenRatioCard').then(m => ({ default: m.GoldenRatioGrid })), { ssr: false });
const GoldenSpiralItem = dynamic(() => import('@/components/premium/GoldenRatioCard').then(m => ({ default: m.GoldenSpiralItem })), { ssr: false });
const PremiumBadge = dynamic(() => import('@/components/premium/PremiumBadge').then(m => ({ default: m.PremiumBadge })), { ssr: false });
const PremiumFeatureLabel = dynamic(() => import('@/components/premium/PremiumBadge').then(m => ({ default: m.PremiumFeatureLabel })), { ssr: false });
const PremiumGlowWrapper = dynamic(() => import('@/components/premium/PremiumBadge').then(m => ({ default: m.PremiumGlowWrapper })), { ssr: false });

// LAYOUT COMPONENTS (4 components)
const ModernHeader = dynamic(() => import('@/components/layout/modern-header').then(m => ({ default: m.ModernHeader })), { ssr: false });
const Footer = dynamic(() => import('@/components/layout/Footer').then(m => ({ default: m.Footer })), { ssr: false });
const FooterSignature = dynamic(() => import('@/components/layout/Footer').then(m => ({ default: m.FooterSignature })), { ssr: false });
const FooterLivingEdge = dynamic(() => import('@/components/layout/Footer').then(m => ({ default: m.FooterLivingEdge })), { ssr: false });

// NAVIGATION (1 component)
const NavigationMenu = dynamic(() => import('@/components/navigation/NavigationMenu').then(m => ({ default: m.NavigationMenu })), { ssr: false });

// EFFECTS (8 components)
const LightDoor = dynamic(() => import('@/components/effects/LightDoor').then(m => ({ default: m.LightDoor })), { ssr: false });
const LightDoorHDR = dynamic(() => import('@/components/effects/LightDoorHDR').then(m => ({ default: m.LightDoorHDR })), { ssr: false });
const LightDoor3D = dynamic(() => import('@/components/effects/LightDoor3D').then(m => ({ default: m.LightDoor3D })), { ssr: false });
const CosmicStarBackground = dynamic(() => import('@/components/effects/CosmicStarBackground').then(m => ({ default: m.CosmicStarBackground })), { ssr: false });
const SettingsPageEffects = dynamic(() => import('@/components/effects/SettingsPageEffects').then(m => ({ default: m.SettingsPageEffects })), { ssr: false });
const FloatingAIOrb = dynamic(() => import('@/components/effects/SettingsPageEffects').then(m => ({ default: m.FloatingAIOrb })), { ssr: false });

// FLYING CONTROLS (3 components)
const FlyingControls3D = dynamic(() => import('@/components/shared/FlyingControls3D').then(m => ({ default: m.FlyingControls3D })), { ssr: false });
const FlyingModeOverlay = dynamic(() => import('@/components/shared/FlyingControls3D').then(m => ({ default: m.FlyingModeOverlay })), { ssr: false });
const FlyingModeTip = dynamic(() => import('@/components/shared/FlyingControls3D').then(m => ({ default: m.FlyingModeTip })), { ssr: false });

// LOADING SKELETONS (8 components)
const Skeleton = dynamic(() => import('@/components/shared/LoadingSkeletons').then(m => ({ default: m.Skeleton })), { ssr: false });
const TextSkeleton = dynamic(() => import('@/components/shared/LoadingSkeletons').then(m => ({ default: m.TextSkeleton })), { ssr: false });
const CardSkeleton = dynamic(() => import('@/components/shared/LoadingSkeletons').then(m => ({ default: m.CardSkeleton })), { ssr: false });
const SettingsSectionSkeleton = dynamic(() => import('@/components/shared/LoadingSkeletons').then(m => ({ default: m.SettingsSectionSkeleton })), { ssr: false });
const ProfileSkeleton = dynamic(() => import('@/components/shared/LoadingSkeletons').then(m => ({ default: m.ProfileSkeleton })), { ssr: false });
const TableSkeleton = dynamic(() => import('@/components/shared/LoadingSkeletons').then(m => ({ default: m.TableSkeleton })), { ssr: false });
const ChartSkeleton = dynamic(() => import('@/components/shared/LoadingSkeletons').then(m => ({ default: m.ChartSkeleton })), { ssr: false });
const FullPageLoadingSkeleton = dynamic(() => import('@/components/shared/LoadingSkeletons').then(m => ({ default: m.FullPageLoadingSkeleton })), { ssr: false });

// CHAT COMPONENTS (10 components)
const ChatMessage = dynamic(() => import('@/components/chat/ChatMessage').then(m => ({ default: m.ChatMessage })), { ssr: false });
const ChatContainer = dynamic(() => import('@/components/chat/ChatContainer').then(m => ({ default: m.ChatContainer })), { ssr: false });
const GlassMessageInput = dynamic(() => import('@/components/chat/GlassMessageInput').then(m => ({ default: m.GlassMessageInput })), { ssr: false });
const ChatModePanel = dynamic(() => import('@/components/chat/mode/ChatModePanel').then(m => ({ default: m.ChatModePanel })), { ssr: false });
const ChatModeHeader = dynamic(() => import('@/components/chat/mode/ChatModeHeader').then(m => ({ default: m.ChatModeHeader })), { ssr: false });
const ChatModeBody = dynamic(() => import('@/components/chat/mode/ChatModeBody').then(m => ({ default: m.ChatModeBody })), { ssr: false });
const ChatModeSidebar = dynamic(() => import('@/components/chat/mode/ChatModeSidebar').then(m => ({ default: m.ChatModeSidebar })), { ssr: false });
const MessageBubble = dynamic(() => import('@/components/chat/mode/MessageBubble').then(m => ({ default: m.MessageBubble })), { ssr: false });
const CodeBlock = dynamic(() => import('@/components/chat/mode/CodeBlock').then(m => ({ default: m.CodeBlock })), { ssr: false });
const ChatModeInput = dynamic(() => import('@/components/chat/mode/ChatModeInput').then(m => ({ default: m.ChatModeInput })), { ssr: false });

// ANALYTICS (6 components)
const AnalyticsDashboard = dynamic(() => import('@/components/analytics/AnalyticsDashboard').then(m => ({ default: m.AnalyticsDashboard })), { ssr: false });
const Web3Analytics = dynamic(() => import('@/components/analytics/Web3Analytics').then(m => ({ default: m.Web3Analytics })), { ssr: false });
const AgentAnalytics = dynamic(() => import('@/components/analytics/AgentAnalytics').then(m => ({ default: m.AgentAnalytics })), { ssr: false });
const ResponseMetrics = dynamic(() => import('@/components/analytics/ResponseMetrics').then(m => ({ default: m.ResponseMetrics })), { ssr: false });
const EmotionTrends = dynamic(() => import('@/components/analytics/EmotionTrends').then(m => ({ default: m.EmotionTrends })), { ssr: false });
const ConversationInsights = dynamic(() => import('@/components/analytics/ConversationInsights').then(m => ({ default: m.ConversationInsights })), { ssr: false });

// ADMIN (8 components)
const AdminVoiceInterface = dynamic(() => import('@/components/admin/AdminVoiceInterface').then(m => ({ default: m.AdminVoiceInterface })), { ssr: false });
const WorkforceGrid = dynamic(() => import('@/components/admin/WorkforceGrid').then(m => ({ default: m.WorkforceGrid })), { ssr: false });
const EcosystemAdmin = dynamic(() => import('@/components/admin/EcosystemAdmin').then(m => ({ default: m.default })), { ssr: false });
const MobileSummary = dynamic(() => import('@/components/admin/MobileSummary').then(m => ({ default: m.MobileSummary })), { ssr: false });
const SummaryWidget = dynamic(() => import('@/components/admin/SummaryWidget').then(m => ({ default: m.SummaryWidget })), { ssr: false });
const AdminDatabasePanel = dynamic(() => import('@/components/admin/AdminDatabasePanel').then(m => ({ default: m.default })), { ssr: false });
const AdminNexusLangPanel = dynamic(() => import('@/components/admin/AdminNexusLangPanel').then(m => ({ default: m.default })), { ssr: false });

// SETTINGS (10 components)
const SettingsModal = dynamic(() => import('@/components/settings/SettingsModal').then(m => ({ default: m.SettingsModal })), { ssr: false });
const PersonalityPresets = dynamic(() => import('@/components/settings/PersonalityPresets').then(m => ({ default: m.PersonalityPresets })), { ssr: false });
const PersonalitySelector = dynamic(() => import('@/components/settings/PersonalitySelector').then(m => ({ default: m.PersonalitySelector })), { ssr: false });
const VoicePresets = dynamic(() => import('@/components/settings/VoicePresets').then(m => ({ default: m.VoicePresets })), { ssr: false });
const VoiceSamplePlayer = dynamic(() => import('@/components/settings/VoiceSamplePlayer').then(m => ({ default: m.VoiceSamplePlayer })), { ssr: false });
const OrbCustomization = dynamic(() => import('@/components/settings/OrbCustomization').then(m => ({ default: m.OrbCustomization })), { ssr: false });
const SettingsDrawer = dynamic(() => import('@/components/settings/SettingsDrawer').then(m => ({ default: m.SettingsDrawer })), { ssr: false });
const Quality3DSettings = dynamic(() => import('@/components/settings/Quality3DSettings').then(m => ({ default: m.Quality3DSettings })), { ssr: false });
const GlassSettingsPanel = dynamic(() => import('@/components/settings/GlassSettingsPanel').then(m => ({ default: m.GlassSettingsPanel })), { ssr: false });

// ONBOARDING (8 components)
const OnboardingTour = dynamic(() => import('@/components/onboarding/OnboardingTour').then(m => ({ default: m.OnboardingTour })), { ssr: false });
const WelcomeModal = dynamic(() => import('@/components/onboarding/WelcomeModal').then(m => ({ default: m.WelcomeModal })), { ssr: false });
const ContextualTip = dynamic(() => import('@/components/onboarding/ContextualTip').then(m => ({ default: m.ContextualTip })), { ssr: false });
const AchievementBadge = dynamic(() => import('@/components/onboarding/AchievementBadge').then(m => ({ default: m.AchievementBadge })), { ssr: false });
const BetaSignup = dynamic(() => import('@/components/onboarding/BetaSignup').then(m => ({ default: m.BetaSignup })), { ssr: false });
const VoiceChoice = dynamic(() => import('@/components/onboarding/VoiceChoice').then(m => ({ default: m.VoiceChoice })), { ssr: false });
const ContinuePrompt = dynamic(() => import('@/components/onboarding/ContinuePrompt').then(m => ({ default: m.ContinuePrompt })), { ssr: false });
const AppInstallCard = dynamic(() => import('@/components/onboarding/AppInstallCard').then(m => ({ default: m.AppInstallCard })), { ssr: false });

// AGENTIC (3 components)
const AgenticActionCard = dynamic(() => import('@/components/agentic/AgenticActionCard').then(m => ({ default: m.AgenticActionCard })), { ssr: false });
const AgenticActionsPanel = dynamic(() => import('@/components/agentic/AgenticActionsPanel').then(m => ({ default: m.AgenticActionsPanel })), { ssr: false });
const ConfirmationDialog = dynamic(() => import('@/components/agentic/ConfirmationDialog').then(m => ({ default: m.ConfirmationDialog })), { ssr: false });

// AGENTS (5 components)
const AgentChat = dynamic(() => import('@/components/agents/AgentChat').then(m => ({ default: m.AgentChat })), { ssr: false });
const AgentMarketplace = dynamic(() => import('@/components/agents/AgentMarketplace').then(m => ({ default: m.AgentMarketplace })), { ssr: false });
const AgentCard = dynamic(() => import('@/components/agents/AgentCard').then(m => ({ default: m.AgentCard })), { ssr: false });
const InstalledAgents = dynamic(() => import('@/components/agents/InstalledAgents').then(m => ({ default: m.InstalledAgents })), { ssr: false });
const OAuthConnect = dynamic(() => import('@/components/agents/OAuthConnect').then(m => ({ default: m.OAuthConnect })), { ssr: false });

// ERROR HANDLING (3 components)
const GlobalErrorBoundary = dynamic(() => import('@/components/error/GlobalErrorBoundary').then(m => ({ default: m.GlobalErrorBoundary })), { ssr: false });
const ErrorFallback = dynamic(() => import('@/components/error/ErrorFallback').then(m => ({ default: m.ErrorFallback })), { ssr: false });
const VoiceErrorBoundary = dynamic(() => import('@/components/error/VoiceErrorBoundary').then(m => ({ default: m.VoiceErrorBoundary })), { ssr: false });

// STATUS (2 components)
const ConnectionStatus = dynamic(() => import('@/components/status/ConnectionStatus').then(m => ({ default: m.ConnectionStatus })), { ssr: false });
const ProcessingStatus = dynamic(() => import('@/components/status/ProcessingStatus').then(m => ({ default: m.ProcessingStatus })), { ssr: false });

// CREDITS (3 components)
const CreditBalance = dynamic(() => import('@/components/credits/CreditBalance').then(m => ({ default: m.CreditBalance })), { ssr: false });
const CreditTransactions = dynamic(() => import('@/components/credits/CreditTransactions').then(m => ({ default: m.CreditTransactions })), { ssr: false });
const UsageChart = dynamic(() => import('@/components/credits/UsageChart').then(m => ({ default: m.UsageChart })), { ssr: false });

// CONTROLS (2 components)
const BottomBar = dynamic(() => import('@/components/controls/BottomBar').then(m => ({ default: m.BottomBar })), { ssr: false });
const QuickSettingsPopover = dynamic(() => import('@/components/controls/QuickSettingsPopover').then(m => ({ default: m.QuickSettingsPopover })), { ssr: false });

// CONVERSION (2 components)
const SoftConversionCard = dynamic(() => import('@/components/conversion/SoftConversionCard').then(m => ({ default: m.SoftConversionCard })), { ssr: false });
const HardConversionModal = dynamic(() => import('@/components/conversion/HardConversionModal').then(m => ({ default: m.HardConversionModal })), { ssr: false });

// SUBSCRIPTION (5 components)
const FeatureGate = dynamic(() => import('@/components/subscription/FeatureGate').then(m => ({ default: m.FeatureGate })), { ssr: false });
const TrialBanner = dynamic(() => import('@/components/subscription/TrialBanner').then(m => ({ default: m.TrialBanner })), { ssr: false });
const PricingCard = dynamic(() => import('@/components/subscription/PricingCard').then(m => ({ default: m.PricingCard })), { ssr: false });

// WORKSPACE (1 component)
const WorkspaceCards = dynamic(() => import('@/components/workspace/WorkspaceCards').then(m => ({ default: m.WorkspaceCards })), { ssr: false });

// TOOLS (1 component)
const ToolsDashboard = dynamic(() => import('@/components/tools/ToolsDashboard').then(m => ({ default: m.ToolsDashboard })), { ssr: false });

// MEMORY (1 component)
const MemoryPanel = dynamic(() => import('@/components/memory/MemoryPanel').then(m => ({ default: m.MemoryPanel })), { ssr: false });

// TRANSCRIPT (1 component)
const LiveTranscript = dynamic(() => import('@/components/transcript/LiveTranscript').then(m => ({ default: m.LiveTranscript })), { ssr: false });

// DEV (3 components)
const VoiceDevPanel = dynamic(() => import('@/components/dev/VoiceDevPanel').then(m => ({ default: m.VoiceDevPanel })), { ssr: false });
const EmotionTestPanel = dynamic(() => import('@/components/dev/EmotionTestPanel').then(m => ({ default: m.EmotionTestPanel })), { ssr: false });
const LatencyMonitor = dynamic(() => import('@/components/dev/LatencyMonitor').then(m => ({ default: m.LatencyMonitor })), { ssr: false });

// UI COMPONENTS (6 components)
const FileUpload = dynamic(() => import('@/components/ui/FileUpload').then(m => ({ default: m.FileUpload })), { ssr: false });
const FileHub = dynamic(() => import('@/components/ui/FileHub').then(m => ({ default: m.FileHub })), { ssr: false });
const GuestLimitsIndicator = dynamic(() => import('@/components/ui/GuestLimitsIndicator').then(m => ({ default: m.GuestLimitsIndicator })), { ssr: false });
const GuestLimitsIndicatorV2 = dynamic(() => import('@/components/ui/GuestLimitsIndicatorV2').then(m => ({ default: m.GuestLimitsIndicatorV2 })), { ssr: false });
const CookieConsent = dynamic(() => import('@/components/ui/CookieConsent').then(m => ({ default: m.CookieConsent })), { ssr: false });
const ToSAcceptanceModal = dynamic(() => import('@/components/ui/ToSAcceptanceModal').then(m => ({ default: m.ToSAcceptanceModal })), { ssr: false });

// BILLING (1 component)
const PaymentFailedBanner = dynamic(() => import('@/components/billing/PaymentFailedBanner').then(m => ({ default: m.PaymentFailedBanner })), { ssr: false });

// MARKETING (5 components)
const ArticleEditor = dynamic(() => import('@/components/marketing/ArticleEditor').then(m => ({ default: m.ArticleEditor })), { ssr: false });
const SocialPostGenerator = dynamic(() => import('@/components/marketing/SocialPostGenerator').then(m => ({ default: m.SocialPostGenerator })), { ssr: false });
const PostScheduler = dynamic(() => import('@/components/marketing/PostScheduler').then(m => ({ default: m.PostScheduler })), { ssr: false });
const NewsletterSignup = dynamic(() => import('@/components/marketing/NewsletterSignup').then(m => ({ default: m.NewsletterSignup })), { ssr: false });

// MODES (1 component)
const ModesPanel = dynamic(() => import('@/components/modes/ModesPanel').then(m => ({ default: m.ModesPanel })), { ssr: false });

// PIXEL STREAMING (2 components)
const PixelStreamingPlayer = dynamic(() => import('@/components/pixel-streaming/PixelStreamingPlayer').then(m => ({ default: m.PixelStreamingPlayer })), { ssr: false });
const ImmersiveModeWrapper = dynamic(() => import('@/components/pixel-streaming/ImmersiveModeWrapper').then(m => ({ default: m.ImmersiveModeWrapper })), { ssr: false });

// ============================================================================
// COMPONENT CATEGORIES DEFINITION
// ============================================================================

interface ComponentItem {
  id: string;
  name: string;
  component: React.ComponentType<any>;
  description: string;
  tags: string[];
  status: 'active' | 'beta' | 'deprecated' | 'recommended';
  version: string;
  is3D?: boolean;
  requiresCanvas?: boolean;
}

interface Category {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  components: ComponentItem[];
  color: string;
}

const CATEGORIES: Category[] = [
  {
    id: 'boot-sequences',
    name: 'Boot Sequences',
    icon: <Zap className="w-5 h-5" />,
    description: 'Premium cinematic boot animations for first-time and returning users',
    color: '#00D4FF',
    components: [
      { id: 'galion-ultimate-boot', name: 'GalionUltimateBoot', component: GalionUltimateBoot, description: 'MD2026 Ultimate Boot - Consent + Birth + Premium Blue Orb', tags: ['MD2026', 'Premium', 'Recommended'], status: 'recommended', version: '2.0.0' },
      { id: 'birth-of-a-star', name: 'BirthOfAStar', component: BirthOfAStar, description: 'Cinematic sacred geometry birth animation', tags: ['Cinematic', '3D', 'Sacred Geometry'], status: 'active', version: '1.0.0', is3D: true },
      { id: 'galion-os-boot-v7', name: 'GalionOSBootV7', component: GalionOSBootV7, description: 'V7 boot with cosmic orb - 50 emotions', tags: ['V7', '3D', 'Cosmic'], status: 'recommended', version: '7.2.0', is3D: true },
      { id: 'galion-orb-v7', name: 'GalionOrbV7', component: GalionOrbV7, description: 'Epic 50-emotion cosmic orb with 8K shaders', tags: ['V7', '3D', 'WebGL', '8K'], status: 'recommended', version: '7.2.0', is3D: true, requiresCanvas: true },
      { id: 'galion-orb-v7-enhanced', name: 'GalionOrbV7Enhanced', component: GalionOrbV7Enhanced, description: 'Modular enhanced V7 orb', tags: ['V7', '3D', 'Modular'], status: 'active', version: '7.2.0', is3D: true, requiresCanvas: true },
      { id: 'galion-os-boot-v3', name: 'GalionOSBootV3', component: GalionOSBootV3, description: 'V3 boot with Galion OS text', tags: ['V3', 'Text Animation'], status: 'active', version: '3.0.0' },
      { id: 'galion-os-boot-v2', name: 'GalionOSBootV2', component: GalionOSBootV2, description: 'Ultra-fast beta boot screen', tags: ['V2', 'Fast', 'Beta'], status: 'deprecated', version: '2.0.0' },
      { id: 'enhanced-galion-os-boot', name: 'EnhancedGalionOSBoot', component: EnhancedGalionOSBoot, description: 'Enhanced boot animation with effects', tags: ['Enhanced', 'Effects'], status: 'active', version: '1.5.0' },
      { id: 'galion-os-boot-v542', name: 'GalionOSBootV542', component: GalionOSBootV542, description: 'V5.4.2 advanced boot sequence', tags: ['V5.4.2', 'Advanced'], status: 'active', version: '5.4.2' },
      { id: 'unified-boot-sequence', name: 'UnifiedBootSequence', component: UnifiedBootSequence, description: 'Unified boot experience for all users', tags: ['Unified', 'Complete'], status: 'active', version: '1.0.0' },
      { id: 'wake-up', name: 'WakeUp', component: WakeUp, description: 'Returning user animation (~3.5s)', tags: ['Returning', 'Fast'], status: 'active', version: '1.0.0' },
      { id: 'welcome-questions', name: 'WelcomeQuestions', component: WelcomeQuestions, description: 'Deep personalization flow inspired by Her', tags: ['Personalization', 'Her'], status: 'active', version: '1.0.0' },
      { id: 'first-interaction-celebration', name: 'FirstInteractionCelebration', component: FirstInteractionCelebration, description: 'One-time celebration after first voice interaction', tags: ['Celebration', 'One-time'], status: 'active', version: '1.0.0' },
      { id: 'boot-error-boundary', name: 'BootErrorBoundary', component: BootErrorBoundary, description: 'Error boundary for boot sequences', tags: ['Error', 'Boundary'], status: 'active', version: '1.0.0' },
      { id: 'lottie-boot-animation', name: 'LottieBootAnimation', component: LottieBootAnimation, description: 'Lottie-based boot animations', tags: ['Lottie', 'Animation'], status: 'active', version: '1.0.0' },
    ],
  },
  {
    id: 'boot-phases',
    name: 'Boot Phases',
    icon: <Layers className="w-5 h-5" />,
    description: 'Individual phase components for boot sequences',
    color: '#8B5CF6',
    components: [
      { id: 'consent-phase', name: 'ConsentPhase', component: ConsentPhase, description: 'Rules + mic permission phase', tags: ['Phase', 'Consent'], status: 'active', version: '1.0.0' },
      { id: 'birth-phase', name: 'BirthPhase', component: BirthPhase, description: 'Orb birth animation phase', tags: ['Phase', 'Birth', '3D'], status: 'active', version: '1.0.0', is3D: true },
      { id: 'welcome-phase', name: 'WelcomePhase', component: WelcomePhase, description: 'Welcome message phase', tags: ['Phase', 'Welcome'], status: 'active', version: '1.0.0' },
      { id: 'wake-phase', name: 'WakePhase', component: WakePhase, description: 'Wake animation phase', tags: ['Phase', 'Wake'], status: 'active', version: '1.0.0' },
      { id: 'greeting-phase', name: 'GreetingPhase', component: GreetingPhase, description: 'Greeting display phase', tags: ['Phase', 'Greeting'], status: 'active', version: '1.0.0' },
      { id: 'galion-boot-phase', name: 'GalionBootPhase', component: GalionBootPhase, description: 'GalionOS boot phase', tags: ['Phase', 'GalionOS'], status: 'active', version: '1.0.0' },
      { id: 'orbing-phase', name: 'OrbingPhase', component: OrbingPhase, description: 'Orb appears phase', tags: ['Phase', 'Orb'], status: 'active', version: '1.0.0' },
      { id: 'system-boot-phase', name: 'SystemBootPhase', component: SystemBootPhase, description: 'System init phase', tags: ['Phase', 'System'], status: 'active', version: '1.0.0' },
      { id: 'void-phase', name: 'VoidPhase', component: VoidPhase, description: 'Darkness with light phase', tags: ['Phase', 'Void'], status: 'active', version: '1.0.0' },
    ],
  },
  {
    id: 'v7-orb-components',
    name: 'V7 Orb Components',
    icon: <Sparkles className="w-5 h-5" />,
    description: 'Modular V7 orb sub-components with cosmic shaders',
    color: '#F472B6',
    components: [
      { id: 'orb-plasma-core', name: 'OrbPlasmaCore', component: OrbPlasmaCore, description: 'Central consciousness plasma core', tags: ['V7', '3D', 'Core'], status: 'active', version: '7.0.0', is3D: true, requiresCanvas: true },
      { id: 'orb-glass-surface-v7', name: 'OrbGlassSurface', component: OrbGlassSurfaceV7, description: 'Iridescent glass shell', tags: ['V7', '3D', 'Glass'], status: 'active', version: '7.0.0', is3D: true, requiresCanvas: true },
      { id: 'orb-particle-field', name: 'OrbParticleField', component: OrbParticleField, description: '600+ cosmic particles', tags: ['V7', '3D', 'Particles'], status: 'active', version: '7.0.0', is3D: true, requiresCanvas: true },
      { id: 'orb-energy-rings', name: 'OrbEnergyRings', component: OrbEnergyRings, description: '5 holographic energy rings', tags: ['V7', '3D', 'Rings'], status: 'active', version: '7.0.0', is3D: true, requiresCanvas: true },
      { id: 'orb-lightning-tendrils', name: 'OrbLightningTendrils', component: OrbLightningTendrils, description: '12 energy connection tendrils', tags: ['V7', '3D', 'Lightning'], status: 'active', version: '7.0.0', is3D: true, requiresCanvas: true },
      { id: 'orb-birth-sequence', name: 'OrbBirthSequence', component: OrbBirthSequence, description: 'Cinematic orb birth animation', tags: ['V7', '3D', 'Birth'], status: 'active', version: '7.0.0', is3D: true, requiresCanvas: true },
    ],
  },
  {
    id: 'cosmos-backgrounds',
    name: 'Cosmos Backgrounds',
    icon: <Star className="w-5 h-5" />,
    description: 'Cosmic and star-field backgrounds',
    color: '#10B981',
    components: [
      { id: 'cosmos-background', name: 'CosmosBackground', component: CosmosBackground, description: '2D cosmos background', tags: ['2D', 'Cosmos', 'Background'], status: 'active', version: '1.0.0' },
      { id: 'cosmic-background', name: 'CosmicBackground', component: CosmicBackground, description: '3D cosmic background for V7', tags: ['3D', 'V7', 'Background'], status: 'active', version: '7.0.0', is3D: true, requiresCanvas: true },
    ],
  },
  {
    id: 'gatekeeper',
    name: 'Gatekeeper',
    icon: <Shield className="w-5 h-5" />,
    description: 'Premium first-user experience components',
    color: '#EF4444',
    components: [
      { id: 'galion-gatekeeper-v2', name: 'GalionGatekeeperV2', component: GalionGatekeeperV2, description: 'Full gatekeeper with flowing lines', tags: ['V2', 'Premium', 'Recommended'], status: 'recommended', version: '2.0.0' },
      { id: 'galion-os-boot-gatekeeper', name: 'GalionOSBoot', component: GalionOSBootGatekeeper, description: 'Seamless boot gatekeeper', tags: ['Boot', 'Seamless'], status: 'deprecated', version: '1.0.0' },
      { id: 'welcome-screen', name: 'WelcomeScreen', component: WelcomeScreen, description: 'Welcome screen for new users', tags: ['Welcome', 'New Users'], status: 'deprecated', version: '1.0.0' },
      { id: 'welcome-back', name: 'WelcomeBack', component: WelcomeBack, description: 'Returning user welcome', tags: ['Welcome', 'Returning'], status: 'deprecated', version: '1.0.0' },
      { id: 'welcome-back-v2', name: 'WelcomeBackV2', component: WelcomeBackV2, description: 'V2 returning user welcome', tags: ['V2', 'Returning', 'Recommended'], status: 'recommended', version: '2.0.0' },
    ],
  },
  {
    id: 'workspace3d-orbs',
    name: 'Workspace3D Orbs',
    icon: <Box className="w-5 h-5" />,
    description: 'Living AI presence orbs for 3D workspaces',
    color: '#3B82F6',
    components: [
      { id: 'galion-orb-v3', name: 'GalionOrbV3', component: GalionOrbV3, description: 'Living AI presence orb', tags: ['V3', '3D', 'WebGL'], status: 'active', version: '3.0.0', is3D: true, requiresCanvas: true },
      { id: 'galion-orb-v5', name: 'GalionOrbV5', component: GalionOrbV5, description: '10-layer production orb', tags: ['V5', '3D', 'Production'], status: 'active', version: '5.0.0', is3D: true, requiresCanvas: true },
      { id: 'galion-orb-v6', name: 'GalionOrbV6', component: GalionOrbV6, description: 'Simplified multi-layer orb', tags: ['V6', '3D', 'Simplified'], status: 'active', version: '6.0.0', is3D: true, requiresCanvas: true },
      // GalionOrbComplete entry removed - component does not exist
      { id: 'galion-orb-advanced', name: 'GalionOrbAdvanced', component: GalionOrbAdvanced, description: 'Advanced shader orb', tags: ['Advanced', '3D', 'Shaders'], status: 'active', version: '1.0.0', is3D: true, requiresCanvas: true },
      { id: 'mobile-orb-v3', name: 'MobileOrbV3', component: MobileOrbV3, description: 'Mobile-optimized orb', tags: ['Mobile', '3D', 'Optimized'], status: 'active', version: '3.0.0', is3D: true, requiresCanvas: true },
      { id: 'orb-demo-controller', name: 'OrbDemoController', component: OrbDemoController, description: 'Interactive orb demo controller', tags: ['Demo', 'Controller'], status: 'active', version: '1.0.0' },
      { id: 'orb-inner-universe', name: 'OrbInnerUniverse', component: OrbInnerUniverse, description: 'Deep space orb interior', tags: ['3D', 'Interior', 'Space'], status: 'active', version: '1.0.0', is3D: true, requiresCanvas: true },
    ],
  },
  {
    id: 'jarvis-orbs',
    name: 'Jarvis/Iron Man Orbs',
    icon: <Cpu className="w-5 h-5" />,
    description: 'MCU-accurate Jarvis AI hologram implementations',
    color: '#F59E0B',
    components: [
      { id: 'iron-man-jarvis-orb', name: 'IronManJarvisOrb', component: IronManJarvisOrb, description: 'Jarvis AI orb', tags: ['Jarvis', '3D', 'MCU'], status: 'active', version: '1.0.0', is3D: true, requiresCanvas: true },
      { id: 'iron-man-jarvis-orb-advanced', name: 'IronManJarvisOrbAdvanced', component: IronManJarvisOrbAdvanced, description: 'Advanced Jarvis orb', tags: ['Jarvis', '3D', 'Advanced'], status: 'active', version: '1.0.0', is3D: true, requiresCanvas: true },
      { id: 'iron-man-jarvis-orb-movie-accurate', name: 'IronManJarvisOrbMovieAccurate', component: IronManJarvisOrbMovieAccurate, description: 'MCU movie-accurate Jarvis', tags: ['Jarvis', '3D', 'Movie Accurate'], status: 'recommended', version: '1.0.0', is3D: true, requiresCanvas: true },
      { id: 'iron-man-jarvis-hologram-2008', name: 'IronManJarvisHologram2008', component: IronManJarvisHologram2008, description: '2008 Iron Man hologram', tags: ['Jarvis', '3D', '2008'], status: 'active', version: '1.0.0', is3D: true, requiresCanvas: true },
      { id: 'iron-man-jarvis-hologram-2008-simple', name: 'IronManJarvisHologram2008Simple', component: IronManJarvisHologram2008Simple, description: 'Simple 2008 hologram', tags: ['Jarvis', '3D', 'Simple'], status: 'active', version: '1.0.0', is3D: true, requiresCanvas: true },
      { id: 'jarvis-nexus-core', name: 'JarvisNexusCore', component: JarvisNexusCore, description: 'Nexus-branded Jarvis core', tags: ['Jarvis', '3D', 'Nexus'], status: 'active', version: '1.0.0', is3D: true, requiresCanvas: true },
      { id: 'jarvis-orb', name: 'JarvisOrb', component: JarvisOrb, description: 'Basic Jarvis orb', tags: ['Jarvis', '3D'], status: 'active', version: '1.0.0', is3D: true, requiresCanvas: true },
      { id: 'jarvis-orb-hud', name: 'JarvisOrbHUD', component: JarvisOrbHUD, description: 'Jarvis HUD overlay', tags: ['Jarvis', 'HUD', 'Overlay'], status: 'active', version: '1.0.0' },
      { id: 'jarvis-voice-waveform', name: 'JarvisVoiceWaveform', component: JarvisVoiceWaveform, description: 'Jarvis voice waveform', tags: ['Jarvis', 'Voice', 'Waveform'], status: 'active', version: '1.0.0', is3D: true, requiresCanvas: true },
      { id: 'jarvis-neural-network', name: 'JarvisNeuralNetwork', component: JarvisNeuralNetwork, description: 'Neural network visualization', tags: ['Jarvis', '3D', 'Neural'], status: 'active', version: '1.0.0', is3D: true, requiresCanvas: true },
      { id: 'jarvis-controls', name: 'JarvisControls', component: JarvisControls, description: 'Jarvis control panel', tags: ['Jarvis', 'Controls'], status: 'active', version: '1.0.0' },
    ],
  },
  {
    id: 'voice-components',
    name: 'Voice Components',
    icon: <Mic className="w-5 h-5" />,
    description: 'Voice AI interaction components',
    color: '#EC4899',
    components: [
      { id: 'voice-orb', name: 'VoiceOrb', component: VoiceOrb, description: '2D voice orb with 50 emotions', tags: ['Voice', '2D', '50 Emotions'], status: 'active', version: '1.0.0' },
      { id: 'voice-orb-3d', name: 'VoiceOrb3D', component: VoiceOrb3D, description: '3D WebGL voice orb', tags: ['Voice', '3D', 'WebGL'], status: 'active', version: '1.0.0', is3D: true },
      { id: 'voice-orb-v542', name: 'VoiceOrbV542', component: VoiceOrbV542, description: 'Ultimate V5.4.2 voice orb', tags: ['Voice', 'V5.4.2', 'Ultimate'], status: 'recommended', version: '5.4.2' },
      { id: 'voice-orb-websocket', name: 'VoiceOrbWebSocket', component: VoiceOrbWebSocket, description: 'WebSocket integrated voice orb', tags: ['Voice', 'WebSocket', 'Real-time'], status: 'recommended', version: '1.0.0' },
      { id: 'voice-ai-interface', name: 'VoiceAIInterface', component: VoiceAIInterface, description: 'Main voice interface container', tags: ['Voice', 'Interface', 'Main'], status: 'active', version: '1.0.0' },
      { id: 'voice-interface-v52', name: 'VoiceInterfaceV52', component: VoiceInterfaceV52, description: 'V5.2 voice interface', tags: ['Voice', 'V5.2', 'Interface'], status: 'active', version: '5.2.0' },
      { id: 'voice-interface-v54', name: 'VoiceInterfaceV54', component: VoiceInterfaceV54, description: 'V5.4 voice interface', tags: ['Voice', 'V5.4', 'Interface'], status: 'recommended', version: '5.4.0' },
      { id: 'voice-dashboard-panel', name: 'VoiceDashboardPanel', component: VoiceDashboardPanel, description: 'Voice dashboard widget', tags: ['Voice', 'Dashboard', 'Widget'], status: 'active', version: '1.0.0' },
      { id: 'voice-controls', name: 'VoiceControls', component: VoiceControls, description: 'Voice control panel', tags: ['Voice', 'Controls'], status: 'active', version: '1.0.0' },
      { id: 'voice-settings', name: 'VoiceSettings', component: VoiceSettings, description: 'Voice configuration panel', tags: ['Voice', 'Settings'], status: 'active', version: '1.0.0' },
      { id: 'model-selector', name: 'ModelSelector', component: ModelSelector, description: 'AI model selection', tags: ['Voice', 'Model', 'Selector'], status: 'active', version: '1.0.0' },
      { id: 'voice-customization', name: 'VoiceCustomization', component: VoiceCustomization, description: 'Voice personality customization', tags: ['Voice', 'Customization', 'Personality'], status: 'active', version: '1.0.0' },
      { id: 'conversation-display', name: 'ConversationDisplay', component: ConversationDisplay, description: 'Message display component', tags: ['Voice', 'Conversation', 'Display'], status: 'active', version: '1.0.0' },
      { id: 'real-time-transcript', name: 'RealTimeTranscript', component: RealTimeTranscript, description: 'Live transcription display', tags: ['Voice', 'Transcript', 'Real-time'], status: 'active', version: '1.0.0' },
      { id: 'audio-waveform', name: 'AudioWaveform', component: AudioWaveform, description: 'Audio visualization waveform', tags: ['Voice', 'Audio', 'Waveform'], status: 'active', version: '1.0.0' },
      { id: 'emotion-indicator', name: 'EmotionIndicator', component: EmotionIndicator, description: 'Emotion badge indicator', tags: ['Voice', 'Emotion', 'Badge'], status: 'active', version: '1.0.0' },
    ],
  },
  {
    id: 'glass-components',
    name: 'Glass Components',
    icon: <Monitor className="w-5 h-5" />,
    description: 'Glass morphism UI components',
    color: '#06B6D4',
    components: [
      { id: 'glass-panel', name: 'GlassPanel', component: GlassPanel, description: 'Glass morphism panel', tags: ['Glass', 'Panel', 'UI'], status: 'active', version: '1.0.0' },
      { id: 'glass-card', name: 'GlassCard', component: GlassCard, description: 'Glass morphism card', tags: ['Glass', 'Card', 'UI'], status: 'active', version: '1.0.0' },
      { id: 'glass-button', name: 'GlassButton', component: GlassButton, description: 'Glass morphism button', tags: ['Glass', 'Button', 'UI'], status: 'active', version: '1.0.0' },
      { id: 'glass-toolbar', name: 'GlassToolbar', component: GlassToolbar, description: 'Floating glass toolbar', tags: ['Glass', 'Toolbar', 'Floating'], status: 'active', version: '1.0.0' },
    ],
  },
  {
    id: 'premium-components',
    name: 'Premium Components',
    icon: <Sparkles className="w-5 h-5" />,
    description: 'Premium design components with golden ratio',
    color: '#FBBF24',
    components: [
      { id: 'golden-ratio-card', name: 'GoldenRatioCard', component: GoldenRatioCard, description: 'Golden ratio card design', tags: ['Premium', 'Golden Ratio', 'Card'], status: 'active', version: '1.0.0' },
      { id: 'golden-ratio-grid', name: 'GoldenRatioGrid', component: GoldenRatioGrid, description: 'Golden ratio grid layout', tags: ['Premium', 'Golden Ratio', 'Grid'], status: 'active', version: '1.0.0' },
      { id: 'golden-spiral-item', name: 'GoldenSpiralItem', component: GoldenSpiralItem, description: 'Golden spiral item', tags: ['Premium', 'Golden Ratio', 'Spiral'], status: 'active', version: '1.0.0' },
      { id: 'premium-badge', name: 'PremiumBadge', component: PremiumBadge, description: 'Premium badge indicator', tags: ['Premium', 'Badge'], status: 'active', version: '1.0.0' },
      { id: 'premium-feature-label', name: 'PremiumFeatureLabel', component: PremiumFeatureLabel, description: 'Premium feature label', tags: ['Premium', 'Label', 'Feature'], status: 'active', version: '1.0.0' },
      { id: 'premium-glow-wrapper', name: 'PremiumGlowWrapper', component: PremiumGlowWrapper, description: 'Animated glow wrapper', tags: ['Premium', 'Glow', 'Animation'], status: 'active', version: '1.0.0' },
    ],
  },
  {
    id: 'layout-components',
    name: 'Layout Components',
    icon: <Layout className="w-5 h-5" />,
    description: 'Page layout and structure components',
    color: '#8B5CF6',
    components: [
      { id: 'modern-header', name: 'ModernHeader', component: ModernHeader, description: 'Modern page header', tags: ['Layout', 'Header', 'Navigation'], status: 'active', version: '1.0.0' },
      { id: 'footer', name: 'Footer', component: Footer, description: 'Page footer component', tags: ['Layout', 'Footer'], status: 'active', version: '1.0.0' },
      { id: 'footer-signature', name: 'FooterSignature', component: FooterSignature, description: 'Footer signature component', tags: ['Layout', 'Footer', 'Signature'], status: 'active', version: '1.0.0' },
      { id: 'footer-living-edge', name: 'FooterLivingEdge', component: FooterLivingEdge, description: 'Living edge footer', tags: ['Layout', 'Footer', 'Animated'], status: 'active', version: '1.0.0' },
      { id: 'navigation-menu', name: 'NavigationMenu', component: NavigationMenu, description: 'Navigation menu component', tags: ['Layout', 'Navigation', 'Menu'], status: 'active', version: '1.0.0' },
    ],
  },
  {
    id: 'effects',
    name: 'Visual Effects',
    icon: <Eye className="w-5 h-5" />,
    description: 'Visual effects and animations',
    color: '#F97316',
    components: [
      { id: 'light-door', name: 'LightDoor', component: LightDoor, description: 'Light door effect', tags: ['Effect', 'Light', 'Door'], status: 'active', version: '1.0.0' },
      { id: 'light-door-hdr', name: 'LightDoorHDR', component: LightDoorHDR, description: 'HDR light door with bloom', tags: ['Effect', 'Light', 'HDR'], status: 'active', version: '1.0.0' },
      { id: 'light-door-3d', name: 'LightDoor3D', component: LightDoor3D, description: '3D light door effect', tags: ['Effect', '3D', 'Light'], status: 'active', version: '1.0.0', is3D: true },
      { id: 'cosmic-star-background', name: 'CosmicStarBackground', component: CosmicStarBackground, description: 'Fullscreen star field effect', tags: ['Effect', 'Stars', 'Background'], status: 'active', version: '1.0.0' },
      { id: 'settings-page-effects', name: 'SettingsPageEffects', component: SettingsPageEffects, description: 'AI-themed visual elements', tags: ['Effect', 'Settings', 'AI'], status: 'active', version: '1.0.0' },
      { id: 'floating-ai-orb', name: 'FloatingAIOrb', component: FloatingAIOrb, description: 'Floating AI orb effect', tags: ['Effect', 'AI', 'Floating'], status: 'active', version: '1.0.0' },
    ],
  },
  {
    id: 'chat-components',
    name: 'Chat Components',
    icon: <MessageSquare className="w-5 h-5" />,
    description: 'World-class chat experience components',
    color: '#22C55E',
    components: [
      { id: 'chat-message', name: 'ChatMessage', component: ChatMessage, description: 'Chat message bubble', tags: ['Chat', 'Message', 'Bubble'], status: 'active', version: '1.0.0' },
      { id: 'chat-container', name: 'ChatContainer', component: ChatContainer, description: 'Chat container component', tags: ['Chat', 'Container'], status: 'active', version: '1.0.0' },
      { id: 'glass-message-input', name: 'GlassMessageInput', component: GlassMessageInput, description: 'Glass style message input', tags: ['Chat', 'Input', 'Glass'], status: 'active', version: '1.0.0' },
      { id: 'chat-mode-panel', name: 'ChatModePanel', component: ChatModePanel, description: 'Full chat mode panel', tags: ['Chat', 'Panel', 'Mode'], status: 'active', version: '1.0.0' },
      { id: 'chat-mode-header', name: 'ChatModeHeader', component: ChatModeHeader, description: 'Chat mode header', tags: ['Chat', 'Header'], status: 'active', version: '1.0.0' },
      { id: 'chat-mode-body', name: 'ChatModeBody', component: ChatModeBody, description: 'Chat mode body', tags: ['Chat', 'Body'], status: 'active', version: '1.0.0' },
      { id: 'chat-mode-sidebar', name: 'ChatModeSidebar', component: ChatModeSidebar, description: 'Chat mode sidebar', tags: ['Chat', 'Sidebar'], status: 'active', version: '1.0.0' },
      { id: 'message-bubble', name: 'MessageBubble', component: MessageBubble, description: 'Message bubble component', tags: ['Chat', 'Message', 'Bubble'], status: 'active', version: '1.0.0' },
      { id: 'code-block', name: 'CodeBlock', component: CodeBlock, description: 'Syntax highlighted code block', tags: ['Chat', 'Code', 'Syntax'], status: 'active', version: '1.0.0' },
      { id: 'chat-mode-input', name: 'ChatModeInput', component: ChatModeInput, description: 'Chat mode input field', tags: ['Chat', 'Input'], status: 'active', version: '1.0.0' },
    ],
  },
  {
    id: 'settings-components',
    name: 'Settings Components',
    icon: <Settings className="w-5 h-5" />,
    description: 'Settings and configuration panels',
    color: '#6366F1',
    components: [
      { id: 'settings-modal', name: 'SettingsModal', component: SettingsModal, description: 'Settings modal dialog', tags: ['Settings', 'Modal'], status: 'active', version: '1.0.0' },
      { id: 'personality-presets', name: 'PersonalityPresets', component: PersonalityPresets, description: 'Personality preset selector', tags: ['Settings', 'Personality', 'Presets'], status: 'active', version: '1.0.0' },
      { id: 'personality-selector', name: 'PersonalitySelector', component: PersonalitySelector, description: 'Age-gated personality selector', tags: ['Settings', 'Personality', 'Age-gated'], status: 'recommended', version: '1.0.0' },
      { id: 'voice-presets', name: 'VoicePresets', component: VoicePresets, description: 'Voice preset selector', tags: ['Settings', 'Voice', 'Presets'], status: 'active', version: '1.0.0' },
      { id: 'voice-sample-player', name: 'VoiceSamplePlayer', component: VoiceSamplePlayer, description: 'Voice sample player', tags: ['Settings', 'Voice', 'Audio'], status: 'active', version: '1.0.0' },
      { id: 'orb-customization', name: 'OrbCustomization', component: OrbCustomization, description: 'Orb theme customization', tags: ['Settings', 'Orb', 'Theme'], status: 'active', version: '1.0.0' },
      { id: 'settings-drawer', name: 'SettingsDrawer', component: SettingsDrawer, description: 'Settings drawer panel', tags: ['Settings', 'Drawer'], status: 'active', version: '1.0.0' },
      { id: 'quality-3d-settings', name: 'Quality3DSettings', component: Quality3DSettings, description: '3D quality settings', tags: ['Settings', '3D', 'Quality'], status: 'active', version: '1.0.0' },
      { id: 'glass-settings-panel', name: 'GlassSettingsPanel', component: GlassSettingsPanel, description: 'Glass style settings panel', tags: ['Settings', 'Glass', 'Panel'], status: 'active', version: '1.0.0' },
    ],
  },
  {
    id: 'analytics-components',
    name: 'Analytics Components',
    icon: <Database className="w-5 h-5" />,
    description: 'Analytics and metrics dashboards',
    color: '#0EA5E9',
    components: [
      { id: 'analytics-dashboard', name: 'AnalyticsDashboard', component: AnalyticsDashboard, description: 'Main analytics dashboard', tags: ['Analytics', 'Dashboard'], status: 'active', version: '1.0.0' },
      { id: 'web3-analytics', name: 'Web3Analytics', component: Web3Analytics, description: 'Web3 analytics panel', tags: ['Analytics', 'Web3'], status: 'active', version: '1.0.0' },
      { id: 'agent-analytics', name: 'AgentAnalytics', component: AgentAnalytics, description: 'Agent analytics panel', tags: ['Analytics', 'Agents'], status: 'active', version: '1.0.0' },
      { id: 'response-metrics', name: 'ResponseMetrics', component: ResponseMetrics, description: 'Response metrics display', tags: ['Analytics', 'Metrics', 'Response'], status: 'active', version: '1.0.0' },
      { id: 'emotion-trends', name: 'EmotionTrends', component: EmotionTrends, description: 'Emotion trends chart', tags: ['Analytics', 'Emotion', 'Trends'], status: 'active', version: '1.0.0' },
      { id: 'conversation-insights', name: 'ConversationInsights', component: ConversationInsights, description: 'Conversation insights panel', tags: ['Analytics', 'Conversation', 'Insights'], status: 'active', version: '1.0.0' },
    ],
  },
  {
    id: 'loading-skeletons',
    name: 'Loading Skeletons',
    icon: <Layers className="w-5 h-5" />,
    description: 'Loading state skeleton components',
    color: '#94A3B8',
    components: [
      { id: 'skeleton', name: 'Skeleton', component: Skeleton, description: 'Base skeleton component', tags: ['Loading', 'Skeleton'], status: 'active', version: '1.0.0' },
      { id: 'text-skeleton', name: 'TextSkeleton', component: TextSkeleton, description: 'Text loading skeleton', tags: ['Loading', 'Skeleton', 'Text'], status: 'active', version: '1.0.0' },
      { id: 'card-skeleton', name: 'CardSkeleton', component: CardSkeleton, description: 'Card loading skeleton', tags: ['Loading', 'Skeleton', 'Card'], status: 'active', version: '1.0.0' },
      { id: 'settings-section-skeleton', name: 'SettingsSectionSkeleton', component: SettingsSectionSkeleton, description: 'Settings section skeleton', tags: ['Loading', 'Skeleton', 'Settings'], status: 'active', version: '1.0.0' },
      { id: 'profile-skeleton', name: 'ProfileSkeleton', component: ProfileSkeleton, description: 'Profile loading skeleton', tags: ['Loading', 'Skeleton', 'Profile'], status: 'active', version: '1.0.0' },
      { id: 'table-skeleton', name: 'TableSkeleton', component: TableSkeleton, description: 'Table loading skeleton', tags: ['Loading', 'Skeleton', 'Table'], status: 'active', version: '1.0.0' },
      { id: 'chart-skeleton', name: 'ChartSkeleton', component: ChartSkeleton, description: 'Chart loading skeleton', tags: ['Loading', 'Skeleton', 'Chart'], status: 'active', version: '1.0.0' },
      { id: 'full-page-loading-skeleton', name: 'FullPageLoadingSkeleton', component: FullPageLoadingSkeleton, description: 'Full page loading skeleton', tags: ['Loading', 'Skeleton', 'Full Page'], status: 'active', version: '1.0.0' },
    ],
  },
  {
    id: 'onboarding-components',
    name: 'Onboarding Components',
    icon: <Star className="w-5 h-5" />,
    description: 'User onboarding and tour components',
    color: '#A855F7',
    components: [
      { id: 'onboarding-tour', name: 'OnboardingTour', component: OnboardingTour, description: 'Guided onboarding tour', tags: ['Onboarding', 'Tour', 'Guide'], status: 'active', version: '1.0.0' },
      { id: 'welcome-modal', name: 'WelcomeModal', component: WelcomeModal, description: 'Welcome modal for new users', tags: ['Onboarding', 'Modal', 'Welcome'], status: 'active', version: '1.0.0' },
      { id: 'contextual-tip', name: 'ContextualTip', component: ContextualTip, description: 'Contextual tip tooltips', tags: ['Onboarding', 'Tip', 'Tooltip'], status: 'active', version: '1.0.0' },
      { id: 'achievement-badge', name: 'AchievementBadge', component: AchievementBadge, description: 'Achievement badge display', tags: ['Onboarding', 'Achievement', 'Badge'], status: 'active', version: '1.0.0' },
      { id: 'beta-signup', name: 'BetaSignup', component: BetaSignup, description: 'Beta signup form', tags: ['Onboarding', 'Beta', 'Signup'], status: 'active', version: '1.0.0' },
      { id: 'voice-choice', name: 'VoiceChoice', component: VoiceChoice, description: 'Voice choice selector', tags: ['Onboarding', 'Voice', 'Choice'], status: 'active', version: '1.0.0' },
      { id: 'continue-prompt', name: 'ContinuePrompt', component: ContinuePrompt, description: 'Continue prompt display', tags: ['Onboarding', 'Continue', 'Prompt'], status: 'active', version: '1.0.0' },
      { id: 'app-install-card', name: 'AppInstallCard', component: AppInstallCard, description: 'App install prompt card', tags: ['Onboarding', 'Install', 'PWA'], status: 'active', version: '1.0.0' },
    ],
  },
  {
    id: 'admin-components',
    name: 'Admin Components',
    icon: <Shield className="w-5 h-5" />,
    description: 'Admin and developer tools',
    color: '#DC2626',
    components: [
      { id: 'admin-voice-interface', name: 'AdminVoiceInterface', component: AdminVoiceInterface, description: 'Admin voice interface', tags: ['Admin', 'Voice', 'Interface'], status: 'active', version: '1.0.0' },
      { id: 'workforce-grid', name: 'WorkforceGrid', component: WorkforceGrid, description: 'AI workforce grid (50 employees)', tags: ['Admin', 'Workforce', 'Grid'], status: 'active', version: '1.0.0' },
      { id: 'ecosystem-admin', name: 'EcosystemAdmin', component: EcosystemAdmin, description: 'Ecosystem admin dashboard', tags: ['Admin', 'Ecosystem', 'Dashboard'], status: 'active', version: '1.0.0' },
      { id: 'mobile-summary', name: 'MobileSummary', component: MobileSummary, description: 'Mobile summary widget', tags: ['Admin', 'Mobile', 'Summary'], status: 'active', version: '1.0.0' },
      { id: 'summary-widget', name: 'SummaryWidget', component: SummaryWidget, description: 'Floating summary widget', tags: ['Admin', 'Widget', 'Summary'], status: 'active', version: '1.0.0' },
      { id: 'admin-database-panel', name: 'AdminDatabasePanel', component: AdminDatabasePanel, description: 'Database admin panel', tags: ['Admin', 'Database', 'Panel'], status: 'active', version: '1.0.0' },
      { id: 'admin-nexuslang-panel', name: 'AdminNexusLangPanel', component: AdminNexusLangPanel, description: 'NexusLang statistics panel', tags: ['Admin', 'NexusLang', 'Stats'], status: 'active', version: '1.0.0' },
    ],
  },
  {
    id: 'agent-components',
    name: 'Agent Components',
    icon: <Cpu className="w-5 h-5" />,
    description: 'AI agent interaction components',
    color: '#14B8A6',
    components: [
      { id: 'agent-chat', name: 'AgentChat', component: AgentChat, description: 'Agent chat interface', tags: ['Agent', 'Chat', 'Interface'], status: 'active', version: '1.0.0' },
      { id: 'agent-marketplace', name: 'AgentMarketplace', component: AgentMarketplace, description: 'Agent marketplace', tags: ['Agent', 'Marketplace'], status: 'active', version: '1.0.0' },
      { id: 'agent-card', name: 'AgentCard', component: AgentCard, description: 'Agent card display', tags: ['Agent', 'Card'], status: 'active', version: '1.0.0' },
      { id: 'installed-agents', name: 'InstalledAgents', component: InstalledAgents, description: 'Installed agents list', tags: ['Agent', 'Installed', 'List'], status: 'active', version: '1.0.0' },
      { id: 'oauth-connect', name: 'OAuthConnect', component: OAuthConnect, description: 'OAuth connection UI', tags: ['Agent', 'OAuth', 'Connect'], status: 'active', version: '1.0.0' },
    ],
  },
  {
    id: 'agentic-components',
    name: 'Agentic Components',
    icon: <Zap className="w-5 h-5" />,
    description: 'Agentic action and confirmation components',
    color: '#F43F5E',
    components: [
      { id: 'agentic-action-card', name: 'AgenticActionCard', component: AgenticActionCard, description: 'Agentic action card', tags: ['Agentic', 'Action', 'Card'], status: 'active', version: '1.0.0' },
      { id: 'agentic-actions-panel', name: 'AgenticActionsPanel', component: AgenticActionsPanel, description: 'Agentic actions panel', tags: ['Agentic', 'Actions', 'Panel'], status: 'active', version: '1.0.0' },
      { id: 'confirmation-dialog', name: 'ConfirmationDialog', component: ConfirmationDialog, description: 'Action confirmation dialog', tags: ['Agentic', 'Confirmation', 'Dialog'], status: 'active', version: '1.0.0' },
    ],
  },
  {
    id: 'utility-components',
    name: 'Utility Components',
    icon: <Code className="w-5 h-5" />,
    description: 'Utility and helper components',
    color: '#78716C',
    components: [
      { id: 'connection-status', name: 'ConnectionStatus', component: ConnectionStatus, description: 'Connection status indicator', tags: ['Utility', 'Status', 'Connection'], status: 'active', version: '1.0.0' },
      { id: 'processing-status', name: 'ProcessingStatus', component: ProcessingStatus, description: 'Processing status indicator', tags: ['Utility', 'Status', 'Processing'], status: 'active', version: '1.0.0' },
      { id: 'credit-balance', name: 'CreditBalance', component: CreditBalance, description: 'Credit balance display', tags: ['Utility', 'Credits', 'Balance'], status: 'active', version: '1.0.0' },
      { id: 'credit-transactions', name: 'CreditTransactions', component: CreditTransactions, description: 'Credit transactions list', tags: ['Utility', 'Credits', 'Transactions'], status: 'active', version: '1.0.0' },
      { id: 'usage-chart', name: 'UsageChart', component: UsageChart, description: 'Usage chart display', tags: ['Utility', 'Usage', 'Chart'], status: 'active', version: '1.0.0' },
      { id: 'bottom-bar', name: 'BottomBar', component: BottomBar, description: 'Bottom action bar', tags: ['Utility', 'Controls', 'Bar'], status: 'active', version: '1.0.0' },
      { id: 'live-transcript', name: 'LiveTranscript', component: LiveTranscript, description: 'Live transcript display', tags: ['Utility', 'Transcript', 'Live'], status: 'active', version: '1.0.0' },
      { id: 'tools-dashboard', name: 'ToolsDashboard', component: ToolsDashboard, description: 'Tools dashboard panel', tags: ['Utility', 'Tools', 'Dashboard'], status: 'active', version: '1.0.0' },
      { id: 'memory-panel', name: 'MemoryPanel', component: MemoryPanel, description: 'Memory management panel', tags: ['Utility', 'Memory', 'Panel'], status: 'active', version: '1.0.0' },
      { id: 'workspace-cards', name: 'WorkspaceCards', component: WorkspaceCards, description: 'Workspace job cards', tags: ['Utility', 'Workspace', 'Cards'], status: 'active', version: '1.0.0' },
      { id: 'modes-panel', name: 'ModesPanel', component: ModesPanel, description: 'Modes selection panel', tags: ['Utility', 'Modes', 'Panel'], status: 'active', version: '1.0.0' },
    ],
  },
];

// ============================================================================
// COMPONENT LOADING WRAPPER
// ============================================================================

const ComponentLoader: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Suspense
    fallback={
      <div className="flex items-center justify-center h-full min-h-[200px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-white/50">Loading component...</span>
        </div>
      </div>
    }
  >
    {children}
  </Suspense>
);

// ============================================================================
// STATUS BADGE COMPONENT
// ============================================================================

const StatusBadge: React.FC<{ status: ComponentItem['status'] }> = ({ status }) => {
  const styles = {
    recommended: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    active: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    beta: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    deprecated: 'bg-red-500/20 text-red-400 border-red-500/30',
  };

  const labels = {
    recommended: 'REC',
    active: 'ACTIVE',
    beta: 'BETA',
    deprecated: 'DEP',
  };

  return (
    <span className={`px-1.5 py-0.5 text-[10px] font-bold uppercase rounded border ${styles[status]}`}>
      {labels[status]}
    </span>
  );
};

// ============================================================================
// TAG COMPONENT
// ============================================================================

const ComponentTag: React.FC<{ tag: string }> = ({ tag }) => {
  const getTagColor = (tag: string) => {
    const tagLower = tag.toLowerCase();
    if (tagLower.includes('3d') || tagLower.includes('webgl')) return 'bg-purple-500/20 text-purple-400';
    if (tagLower.includes('md2026')) return 'bg-amber-500/20 text-amber-400';
    if (tagLower.includes('voice')) return 'bg-pink-500/20 text-pink-400';
    if (tagLower.includes('premium')) return 'bg-yellow-500/20 text-yellow-400';
    if (tagLower.includes('v7') || tagLower.includes('v6') || tagLower.includes('v5')) return 'bg-cyan-500/20 text-cyan-400';
    return 'bg-white/10 text-white/60';
  };

  return (
    <span className={`px-1.5 py-0.5 text-[10px] rounded ${getTagColor(tag)}`}>
      {tag}
    </span>
  );
};

// ============================================================================
// CATEGORY SECTION COMPONENT
// ============================================================================

interface CategorySectionProps {
  category: Category;
  isExpanded: boolean;
  onToggle: () => void;
  onSelectComponent: (component: ComponentItem) => void;
  selectedComponentId: string | null;
  searchQuery: string;
  viewMode: 'list' | 'grid';
}

const CategorySection: React.FC<CategorySectionProps> = ({
  category,
  isExpanded,
  onToggle,
  onSelectComponent,
  selectedComponentId,
  searchQuery,
  viewMode,
}) => {
  const filteredComponents = category.components.filter(
    (comp) =>
      comp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      comp.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      comp.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (filteredComponents.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-4"
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
      >
        <motion.div
          animate={{ rotate: isExpanded ? 90 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronRight className="w-4 h-4 text-white/50" />
        </motion.div>
        <div className="p-2 rounded-lg" style={{ backgroundColor: `${category.color}20` }}>
          {React.cloneElement(category.icon as React.ReactElement, {
            style: { color: category.color },
          })}
        </div>
        <div className="flex-1 text-left">
          <div className="flex items-center gap-2">
            <span className="font-medium text-white">{category.name}</span>
            <span className="px-2 py-0.5 text-xs bg-white/10 rounded-full text-white/60">
              {filteredComponents.length}
            </span>
          </div>
          <p className="text-xs text-white/40 mt-0.5">{category.description}</p>
        </div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className={`mt-2 ${viewMode === 'grid' ? 'grid grid-cols-2 lg:grid-cols-3 gap-2' : 'space-y-1'} px-2`}>
              {filteredComponents.map((component) => (
                <motion.button
                  key={component.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onSelectComponent(component)}
                  className={`w-full p-3 rounded-lg text-left transition-colors ${
                    selectedComponentId === component.id
                      ? 'bg-cyan-500/20 border border-cyan-500/50'
                      : 'bg-white/5 hover:bg-white/10 border border-transparent'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-sm text-white truncate">
                          {component.name}
                        </span>
                        <StatusBadge status={component.status} />
                        {component.is3D && (
                          <span className="px-1.5 py-0.5 text-[10px] bg-purple-500/20 text-purple-400 rounded">
                            3D
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-white/40 mt-1 line-clamp-2">
                        {component.description}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {component.tags.slice(0, 3).map((tag) => (
                          <ComponentTag key={tag} tag={tag} />
                        ))}
                        {component.tags.length > 3 && (
                          <span className="text-[10px] text-white/40">
                            +{component.tags.length - 3}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-[10px] text-white/30 font-mono">
                      v{component.version}
                    </span>
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ============================================================================
// COMPONENT PREVIEW PANEL
// ============================================================================

interface PreviewPanelProps {
  component: ComponentItem | null;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onRefresh: () => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
}

const PreviewPanel: React.FC<PreviewPanelProps> = ({
  component,
  isFullscreen,
  onToggleFullscreen,
  onRefresh,
  isPlaying,
  onTogglePlay,
}) => {
  const [key, setKey] = useState(0);

  const handleRefresh = useCallback(() => {
    setKey((prev) => prev + 1);
    onRefresh();
  }, [onRefresh]);

  if (!component) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#0A0A1A]">
        <div className="text-center">
          <Box className="w-16 h-16 text-white/10 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white/50">Select a Component</h3>
          <p className="text-sm text-white/30 mt-2 max-w-xs">
            Choose a component from the sidebar to preview it here
          </p>
        </div>
      </div>
    );
  }

  const Component = component.component;

  return (
    <div className={`flex-1 flex flex-col bg-[#0A0A1A] ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      {/* Preview Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-black/50">
        <div className="flex items-center gap-3">
          <h3 className="font-mono text-white">{component.name}</h3>
          <StatusBadge status={component.status} />
          {component.is3D && (
            <span className="px-2 py-1 text-xs bg-purple-500/20 text-purple-400 rounded">
              Requires Canvas
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onTogglePlay}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 text-white/70" />
            ) : (
              <Play className="w-4 h-4 text-white/70" />
            )}
          </button>
          <button
            onClick={handleRefresh}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4 text-white/70" />
          </button>
          <button
            onClick={onToggleFullscreen}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4 text-white/70" />
            ) : (
              <Maximize2 className="w-4 h-4 text-white/70" />
            )}
          </button>
          {isFullscreen && (
            <button
              onClick={onToggleFullscreen}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors ml-2"
            >
              <X className="w-4 h-4 text-white/70" />
            </button>
          )}
        </div>
      </div>

      {/* Component Info */}
      <div className="px-4 py-3 border-b border-white/5 bg-black/30">
        <p className="text-sm text-white/60">{component.description}</p>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {component.tags.map((tag) => (
            <ComponentTag key={tag} tag={tag} />
          ))}
        </div>
      </div>

      {/* Preview Area */}
      <div className="flex-1 relative overflow-auto">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0A0A1A] via-[#0D1117] to-[#0A0A1A]">
          {/* Grid Pattern */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `
                linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
              `,
              backgroundSize: '50px 50px',
            }}
          />
        </div>

        <div className="relative z-10 h-full flex items-center justify-center p-8">
          <ComponentLoader key={key}>
            <div className="w-full h-full min-h-[400px] max-h-[800px]">
              {component.requiresCanvas ? (
                <div className="w-full h-full" style={{ minHeight: '500px' }}>
                  <Canvas
                    camera={{ position: [0, 0, 5], fov: 50 }}
                    gl={{ antialias: true, alpha: true }}
                    style={{ background: 'transparent' }}
                  >
                    <ambientLight intensity={0.5} />
                    <pointLight position={[10, 10, 10]} intensity={1} />
                    <pointLight position={[-10, -10, -10]} intensity={0.5} />
                    <Suspense fallback={null}>
                      <Component onComplete={() => {}} onSkip={() => {}} />
                      <Environment preset="night" />
                    </Suspense>
                    <OrbitControls
                      enableZoom={true}
                      enablePan={true}
                      enableRotate={true}
                      autoRotate={isPlaying}
                      autoRotateSpeed={0.5}
                    />
                  </Canvas>
                </div>
              ) : (
                <Component onComplete={() => {}} onSkip={() => {}} />
              )}
            </div>
          </ComponentLoader>
        </div>
      </div>

      {/* Preview Footer */}
      <div className="px-4 py-2 border-t border-white/10 bg-black/50 flex items-center justify-between">
        <div className="flex items-center gap-4 text-xs text-white/40">
          <span>Version: {component.version}</span>
          <span>Status: {component.status}</span>
          {component.is3D && <span>Type: 3D/WebGL</span>}
        </div>
        <button className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 transition-colors">
          <ExternalLink className="w-3 h-3" />
          View Source
        </button>
      </div>
    </div>
  );
};

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default function PreviewAllPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(['boot-sequences'])
  );
  const [selectedComponent, setSelectedComponent] = useState<ComponentItem | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [filterTags, setFilterTags] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  // Calculate total components
  const totalComponents = CATEGORIES.reduce((acc, cat) => acc + cat.components.length, 0);

  // Toggle category expansion
  const toggleCategory = useCallback((categoryId: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  }, []);

  // Expand all categories
  const expandAll = useCallback(() => {
    setExpandedCategories(new Set(CATEGORIES.map((cat) => cat.id)));
  }, []);

  // Collapse all categories
  const collapseAll = useCallback(() => {
    setExpandedCategories(new Set());
  }, []);

  // Filter categories by tag
  const filteredCategories = CATEGORIES.map((cat) => ({
    ...cat,
    components: cat.components.filter(
      (comp) =>
        (filterTags.length === 0 || filterTags.some((tag) => comp.tags.includes(tag))) &&
        (searchQuery === '' ||
          comp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          comp.description.toLowerCase().includes(searchQuery.toLowerCase()))
    ),
  })).filter((cat) => cat.components.length > 0);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
      if (e.key === 'f' && e.metaKey) {
        e.preventDefault();
        document.getElementById('search-input')?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  return (
    <div className="min-h-screen bg-[#0A0A1A] text-white flex">
      {/* Sidebar */}
      <motion.aside
        initial={{ x: -300 }}
        animate={{ x: 0 }}
        className={`w-[400px] flex-shrink-0 border-r border-white/10 flex flex-col bg-black/30 backdrop-blur-xl ${
          isFullscreen ? 'hidden' : ''
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-cyan-500/20 rounded-lg">
              <Palette className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold">Component Gallery</h1>
              <p className="text-xs text-white/50">
                {totalComponents} components in {CATEGORIES.length} categories
              </p>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              id="search-input"
              type="text"
              placeholder="Search components... (Cmd+F)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-cyan-500/50"
            />
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={expandAll}
              className="flex-1 px-3 py-1.5 text-xs bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
            >
              Expand All
            </button>
            <button
              onClick={collapseAll}
              className="flex-1 px-3 py-1.5 text-xs bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
            >
              Collapse All
            </button>
            <button
              onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
              className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
            >
              {viewMode === 'list' ? (
                <Grid3X3 className="w-4 h-4" />
              ) : (
                <List className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-1.5 rounded-lg transition-colors ${
                showFilters ? 'bg-cyan-500/20 text-cyan-400' : 'bg-white/5 hover:bg-white/10'
              }`}
            >
              <Filter className="w-4 h-4" />
            </button>
          </div>

          {/* Tag Filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-3 p-3 bg-white/5 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Tag className="w-3 h-3 text-white/50" />
                    <span className="text-xs text-white/50">Filter by tags</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {['3D', 'WebGL', 'Voice', 'Premium', 'V7', 'MD2026', 'Recommended'].map(
                      (tag) => (
                        <button
                          key={tag}
                          onClick={() => {
                            setFilterTags((prev) =>
                              prev.includes(tag)
                                ? prev.filter((t) => t !== tag)
                                : [...prev, tag]
                            );
                          }}
                          className={`px-2 py-1 text-xs rounded transition-colors ${
                            filterTags.includes(tag)
                              ? 'bg-cyan-500/30 text-cyan-400'
                              : 'bg-white/10 text-white/60 hover:bg-white/20'
                          }`}
                        >
                          {tag}
                        </button>
                      )
                    )}
                  </div>
                  {filterTags.length > 0 && (
                    <button
                      onClick={() => setFilterTags([])}
                      className="mt-2 text-xs text-white/40 hover:text-white/60"
                    >
                      Clear filters
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Categories List */}
        <div className="flex-1 overflow-auto p-3">
          {filteredCategories.map((category) => (
            <CategorySection
              key={category.id}
              category={category}
              isExpanded={expandedCategories.has(category.id)}
              onToggle={() => toggleCategory(category.id)}
              onSelectComponent={setSelectedComponent}
              selectedComponentId={selectedComponent?.id || null}
              searchQuery={searchQuery}
              viewMode={viewMode}
            />
          ))}

          {filteredCategories.length === 0 && (
            <div className="text-center py-12">
              <Search className="w-8 h-8 text-white/20 mx-auto mb-3" />
              <p className="text-white/40">No components found</p>
              <p className="text-xs text-white/20 mt-1">
                Try adjusting your search or filters
              </p>
            </div>
          )}
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-white/10 bg-black/30">
          <div className="flex items-center justify-between text-xs text-white/40">
            <span>Galion Component Gallery v1.0</span>
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded">
                {CATEGORIES.reduce(
                  (acc, cat) => acc + cat.components.filter((c) => c.status === 'recommended').length,
                  0
                )}{' '}
                Recommended
              </span>
            </div>
          </div>
        </div>
      </motion.aside>

      {/* Preview Panel */}
      <PreviewPanel
        component={selectedComponent}
        isFullscreen={isFullscreen}
        onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
        onRefresh={() => {}}
        isPlaying={isPlaying}
        onTogglePlay={() => setIsPlaying(!isPlaying)}
      />
    </div>
  );
}
