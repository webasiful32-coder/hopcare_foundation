import { BloodGroup, BloodDonor, BloodRequest } from '../../src/types';

export const COMPATIBLE_DONORS_FOR_RECIPIENT: Record<BloodGroup, BloodGroup[]> = {
  'A+': ['A+', 'A-', 'O+', 'O-'],
  'A-': ['A-', 'O-'],
  'B+': ['B+', 'B-', 'O+', 'O-'],
  'B-': ['B-', 'O-'],
  'AB+': ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
  'AB-': ['AB-', 'A-', 'B-', 'O-'],
  'O+': ['O+', 'O-'],
  'O-': ['O-']
};

export interface MatchScoreResult {
  donor: BloodDonor;
  matchScore: number;
  matchReasons: string[];
  distanceCategory: 'Local Upazila' | 'Same District' | 'Same Division' | 'Other';
}

export class BloodMatchingService {
  isCompatible(donorGroup: BloodGroup, recipientGroup: BloodGroup): boolean {
    const compatibleGroups = COMPATIBLE_DONORS_FOR_RECIPIENT[recipientGroup] || [];
    return compatibleGroups.includes(donorGroup);
  }

  isEligibleByCooldown(lastDonationDate?: string): boolean {
    if (!lastDonationDate) return true;
    const lastDate = new Date(lastDonationDate);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays >= 90; // Standard 90 days minimum whole blood interval
  }

  findMatches(request: BloodRequest, allDonors: BloodDonor[]): MatchScoreResult[] {
    const results: MatchScoreResult[] = [];

    for (const donor of allDonors) {
      if (donor.status !== 'Active') continue;
      if (!this.isCompatible(donor.bloodGroup, request.bloodGroup)) continue;

      let score = 50;
      const reasons: string[] = [];

      if (donor.bloodGroup === request.bloodGroup) {
        score += 20;
        reasons.push(`Exact Blood Match (${donor.bloodGroup})`);
      } else {
        reasons.push(`Compatible Group (${donor.bloodGroup} -> ${request.bloodGroup})`);
      }

      let distanceCategory: 'Local Upazila' | 'Same District' | 'Same Division' | 'Other' = 'Other';

      if (donor.district.toLowerCase() === request.district.toLowerCase()) {
        if (donor.upazila.toLowerCase() === request.upazila.toLowerCase()) {
          score += 30;
          reasons.push(`Immediate Upazila Match (${donor.upazila})`);
          distanceCategory = 'Local Upazila';
        } else {
          score += 20;
          reasons.push(`Same District (${donor.district})`);
          distanceCategory = 'Same District';
        }
      } else if (donor.division.toLowerCase() === request.division.toLowerCase()) {
        score += 10;
        reasons.push(`Same Division (${donor.division})`);
        distanceCategory = 'Same Division';
      }

      if (donor.isAvailable) {
        score += 10;
        reasons.push('Currently Available');
      }

      if (this.isEligibleByCooldown(donor.lastDonationDate)) {
        score += 10;
        reasons.push('Eligible Donation Interval (>90 days)');
      }

      results.push({
        donor,
        matchScore: score,
        matchReasons: reasons,
        distanceCategory
      });
    }

    // Sort by match score descending
    results.sort((a, b) => b.matchScore - a.matchScore);
    return results;
  }
}

export const bloodMatchingService = new BloodMatchingService();
