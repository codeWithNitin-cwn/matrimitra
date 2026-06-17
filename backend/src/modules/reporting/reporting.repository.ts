import { prisma } from "../../config/prisma";

export class ReportingRepository {
  async getDashboardSummary(agencyId: string) {
    const totalProfiles = await prisma.agencyProfile.count({
      where: { agencyId }
    });

    const approvedProfiles = await prisma.agencyProfile.count({
      where: { agencyId, status: "ACTIVE" }
    });

    const pendingProfiles = await prisma.agencyProfile.count({
      where: { agencyId, status: "PENDING" }
    });

    const totalClients = await prisma.client.count({
      where: { agencyId }
    });

    const matchesGenerated = await prisma.compatibilityResult.count({
      where: { sourceProfile: { agencyId } }
    });

    const proposalsSent = await prisma.proposal.count({
      where: { senderAgencyId: agencyId }
    });

    const acceptedProposals = await prisma.proposal.count({
      where: { proposalStatus: "ACCEPTED", OR: [{ senderAgencyId: agencyId }, { receiverAgencyId: agencyId }] }
    });

    const rejectedProposals = await prisma.proposal.count({
      where: { proposalStatus: "REJECTED", OR: [{ senderAgencyId: agencyId }, { receiverAgencyId: agencyId }] }
    });

    const activePipelines = await prisma.pipeline.count({
      where: {
        proposal: {
          OR: [{ senderAgencyId: agencyId }, { receiverAgencyId: agencyId }]
        },
        NOT: {
          currentStage: { in: ["MARRIED", "CLOSED"] }
        }
      }
    });

    const totalCompleted = acceptedProposals + rejectedProposals;
    const conversionRate = totalCompleted > 0 ? Math.round((acceptedProposals / totalCompleted) * 100) : 0;
    const matchConversionRate = matchesGenerated > 0 ? Math.round((acceptedProposals / matchesGenerated) * 100) : 0;

    const pendingApprovalProfiles = await prisma.agencyProfile.findMany({
      where: { agencyId, status: "PENDING" },
      include: { person: true },
      orderBy: { createdAt: "desc" },
      take: 5
    });

    const pendingReceivedProposals = await prisma.proposal.findMany({
      where: { receiverAgencyId: agencyId, proposalStatus: "SENT" },
      include: {
        senderAgency: true,
        brideProfile: { include: { person: true } },
        groomProfile: { include: { person: true } }
      },
      orderBy: { createdAt: "desc" },
      take: 5
    });

    const logs = await prisma.auditLog.findMany({
      where: { agencyId },
      orderBy: { createdAt: "desc" },
      take: 10
    });

    const recentActivities = logs.map(log => {
      let eventText = `${log.entityType} ${log.action.toLowerCase()}`;
      const type = log.entityType.toUpperCase();
      const action = log.action.toUpperCase();

      if (type === "PROFILE") {
        if (action === "APPROVE") eventText = "Profile Approved";
        else if (action === "CREATE") eventText = "Profile Draft Created";
        else if (action === "UPDATE") eventText = "Profile Updated";
        else if (action === "VIEW") eventText = "Profile Viewed";
        else eventText = `Profile status updated to ${log.action.toLowerCase()}`;
      } else if (type === "PROPOSAL") {
        if (action === "CREATE") eventText = "Proposal Sent";
        else if (action === "ACCEPT") eventText = "Proposal Accepted";
        else if (action === "REJECT") eventText = "Proposal Rejected";
        else if (action === "VIEW") eventText = "Proposal Viewed";
      } else if (type === "PIPELINE") {
        if (action === "UPDATE_STAGE") eventText = "Pipeline Stage Updated";
        else eventText = `Pipeline status updated to ${log.action.toLowerCase()}`;
      } else if (type === "CLIENT") {
        if (action === "CREATE") eventText = "Client Registered";
        else if (action === "UPDATE") eventText = "Client Updated";
      } else if (type === "AUTH") {
        if (action === "LOGIN") eventText = "User Logged In";
      }

      return {
        id: log.id,
        entityType: log.entityType,
        entityId: log.entityId,
        action: log.action,
        description: eventText,
        createdAt: log.createdAt
      };
    });

    const aiRecommendations = await this.getAIRecommendations(agencyId);

    const profilesWithAccessCounts = await prisma.agencyProfile.findMany({
      where: { agencyId },
      include: {
        person: true,
        _count: {
          select: { profileAccessLogs: true }
        }
      }
    });

    const mostViewedProfiles = [...profilesWithAccessCounts]
      .filter(p => p._count.profileAccessLogs > 0)
      .sort((a, b) => b._count.profileAccessLogs - a._count.profileAccessLogs)
      .slice(0, 5)
      .map(p => ({
        id: p.id,
        profileNumber: p.profileNumber,
        name: p.person ? `${p.person.firstName} ${p.person.lastName || ''}`.trim() : 'N/A',
        views: p._count.profileAccessLogs
      }));

    const neverViewedProfiles = profilesWithAccessCounts
      .filter(p => p._count.profileAccessLogs === 0)
      .slice(0, 5)
      .map(p => ({
        id: p.id,
        profileNumber: p.profileNumber,
        name: p.person ? `${p.person.firstName} ${p.person.lastName || ''}`.trim() : 'N/A'
      }));

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const dbFollowUps = await prisma.followUp.findMany({
      where: {
        profile: { agencyId }
      },
      include: {
        profile: { include: { person: true } },
        assignedUser: true
      }
    });

    const todaysFollowUps = dbFollowUps
      .filter(f => f.status === "PENDING" && new Date(f.dueDate) >= startOfToday && new Date(f.dueDate) <= endOfToday)
      .map(f => ({
        id: f.id,
        profileNumber: f.profile.profileNumber,
        name: `${f.profile.person.firstName} ${f.profile.person.lastName || ''}`.trim(),
        dueDate: f.dueDate,
        priority: f.priority,
        notes: f.notes
      }));

    const overdueFollowUps = dbFollowUps
      .filter(f => f.status === "PENDING" && new Date(f.dueDate) < startOfToday)
      .map(f => ({
        id: f.id,
        profileNumber: f.profile.profileNumber,
        name: `${f.profile.person.firstName} ${f.profile.person.lastName || ''}`.trim(),
        dueDate: f.dueDate,
        priority: f.priority,
        notes: f.notes
      }));

    const upcomingFollowUps = dbFollowUps
      .filter(f => f.status === "PENDING" && new Date(f.dueDate) > endOfToday)
      .map(f => ({
        id: f.id,
        profileNumber: f.profile.profileNumber,
        name: `${f.profile.person.firstName} ${f.profile.person.lastName || ''}`.trim(),
        dueDate: f.dueDate,
        priority: f.priority,
        notes: f.notes
      }));

    const totalFollowUps = dbFollowUps.length;
    const completedFollowUpsCount = dbFollowUps.filter(f => f.status === "COMPLETED").length;
    const followUpCompletionRate = totalFollowUps > 0 ? Math.round((completedFollowUpsCount / totalFollowUps) * 100) : 0;

    return {
      totalProfiles,
      approvedProfiles,
      pendingProfiles,
      totalClients,
      matchesGenerated,
      proposalsSent,
      acceptedProposals,
      rejectedProposals,
      activePipelines,
      conversionRate,
      matchConversionRate,
      pendingApprovalProfiles,
      pendingReceivedProposals,
      recentActivities,
      aiRecommendations,
      mostViewedProfiles,
      neverViewedProfiles,
      todaysFollowUps,
      overdueFollowUps,
      upcomingFollowUps,
      followUpCompletionRate
    };
  }

  async getAIRecommendations(agencyId: string) {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recommendations = [];

    // 1. Proposal SENT > 7 days -> Follow Up
    const pendingProposals = await prisma.proposal.findMany({
      where: {
        senderAgencyId: agencyId,
        proposalStatus: "SENT",
        createdAt: { lt: sevenDaysAgo }
      },
      include: {
        brideProfile: { include: { person: true } },
        groomProfile: { include: { person: true } }
      }
    });

    for (const p of pendingProposals) {
      const brideName = p.brideProfile?.person?.firstName || "Bride";
      const groomName = p.groomProfile?.person?.firstName || "Groom";
      recommendations.push({
        id: `proposal-sent-7d-${p.id}`,
        priority: "MEDIUM",
        title: "Proposal Follow-Up",
        reason: `Proposal #${p.proposalNumber} for ${groomName} & ${brideName} has been pending for over 7 days.`,
        action: "Follow up with receiving agency",
        entityId: p.id
      });
    }

    // 2. ACCEPTED proposal with no pipeline -> Create Pipeline
    const acceptedNoPipeline = await prisma.proposal.findMany({
      where: {
        OR: [{ senderAgencyId: agencyId }, { receiverAgencyId: agencyId }],
        proposalStatus: "ACCEPTED",
        pipeline: { is: null }
      },
      include: {
        brideProfile: { include: { person: true } },
        groomProfile: { include: { person: true } }
      }
    });

    for (const p of acceptedNoPipeline) {
      const brideName = p.brideProfile?.person?.firstName || "Bride";
      const groomName = p.groomProfile?.person?.firstName || "Groom";
      recommendations.push({
        id: `proposal-accepted-no-pipeline-${p.id}`,
        priority: "HIGH",
        title: "Initialize Pipeline",
        reason: `Proposal #${p.proposalNumber} (${groomName} & ${brideName}) was accepted, but no relationship pipeline has been initialized.`,
        action: "Create pipeline",
        entityId: p.id
      });
    }

    // 3. Pipeline stage unchanged > 7 days -> Follow Up
    const stalledPipelines = await prisma.pipeline.findMany({
      where: {
        proposal: {
          OR: [{ senderAgencyId: agencyId }, { receiverAgencyId: agencyId }]
        },
        stageDate: { lt: sevenDaysAgo },
        NOT: {
          currentStage: { in: ["MARRIED", "CLOSED"] }
        }
      },
      include: {
        proposal: {
          include: {
            brideProfile: { include: { person: true } },
            groomProfile: { include: { person: true } }
          }
        }
      }
    });

    for (const pip of stalledPipelines) {
      const brideName = pip.proposal?.brideProfile?.person?.firstName || "Bride";
      const groomName = pip.proposal?.groomProfile?.person?.firstName || "Groom";
      recommendations.push({
        id: `pipeline-stalled-7d-${pip.id}`,
        priority: "MEDIUM",
        title: "Pipeline Stage Stalled",
        reason: `Pipeline for ${groomName} & ${brideName} has remained in stage "${pip.currentStage}" for over 7 days.`,
        action: "Follow up with client/milestone",
        entityId: pip.id
      });
    }

    // 4. ACTIVE profile with no match results -> Run Match Search
    const approvedProfiles = await prisma.agencyProfile.findMany({
      where: {
        agencyId,
        status: "ACTIVE"
      },
      include: {
        person: true,
        compatibilitiesSent: { take: 1 },
        compatibilitiesReceived: { take: 1 }
      }
    });

    const noMatches = approvedProfiles.filter(p => p.compatibilitiesSent.length === 0 && p.compatibilitiesReceived.length === 0);
    for (const p of noMatches) {
      recommendations.push({
        id: `profile-no-matches-${p.id}`,
        priority: "LOW",
        title: "Run Match Search",
        reason: `Approved profile ${p.profileNumber} (${p.person?.firstName || "Client"}) does not have any generated compatibility matches.`,
        action: "Run match search",
        entityId: p.id
      });
    }

    return recommendations;
  }

  async getProposalStatusReport(agencyId: string) {
    return prisma.proposal.groupBy({
      where: {
        OR: [{ senderAgencyId: agencyId }, { receiverAgencyId: agencyId }]
      },
      by: ["proposalStatus"],
      _count: { proposalStatus: true }
    });
  }

  async getPipelineStageReport(agencyId: string) {
    return prisma.pipeline.groupBy({
      where: {
        proposal: {
          OR: [{ senderAgencyId: agencyId }, { receiverAgencyId: agencyId }]
        }
      },
      by: ["currentStage"],
      _count: { currentStage: true }
    });
  }

  async getDetailedProfiles(agencyId: string) {
    return prisma.agencyProfile.findMany({
      where: { agencyId },
      include: { person: true },
      orderBy: { createdAt: "desc" }
    });
  }

  async getDetailedProposals(agencyId: string) {
    return prisma.proposal.findMany({
      where: {
        OR: [{ senderAgencyId: agencyId }, { receiverAgencyId: agencyId }]
      },
      include: {
        senderAgency: { select: { name: true } },
        receiverAgency: { select: { name: true } },
        brideProfile: { select: { profileNumber: true } },
        groomProfile: { select: { profileNumber: true } }
      },
      orderBy: { createdAt: "desc" }
    });
  }

  async getDetailedPipelines(agencyId: string) {
    return prisma.pipeline.findMany({
      where: {
        proposal: {
          OR: [{ senderAgencyId: agencyId }, { receiverAgencyId: agencyId }]
        }
      },
      include: {
        proposal: {
          include: {
            brideProfile: { select: { profileNumber: true } },
            groomProfile: { select: { profileNumber: true } }
          }
        }
      },
      orderBy: { stageDate: "desc" }
    });
  }
}