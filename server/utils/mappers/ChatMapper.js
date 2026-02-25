export class ChatMapper {
    static toGroupMember(p) {
        return {
            userId: p.userId,
            role: p.role,
            user: p.user ? {
                id: p.user.id,
                name: p.user.name,
                email: p.user.email,
                profileImage: p.user.profileImage,
            } : null
        };
    }

    static toMinimalParticipant(p) {
        return { user: p.user, role: p.role };
    }

    static mapParticipantsToMinimal(participants) {
        if (!Array.isArray(participants)) return [];
        return participants.map(p => this.toMinimalParticipant(p));
    }

    static mapActiveParticipantsToMinimal(participants) {
        if (!Array.isArray(participants)) return [];
        return participants.filter(p => !p.leftAt).map(p => this.toMinimalParticipant(p));
    }
}
