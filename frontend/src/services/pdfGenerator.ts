import { ProposalFormData } from '@/components/proposals/create-proposal-content';

// PDF Generation Service for creating PDFs from form data
export class PDFGeneratorService {
  
  /**
   * Generate a PDF from proposal form data
   * This creates a PDF without needing to save the proposal first
   */
  async generatePDFFromFormData(formData: ProposalFormData): Promise<Blob> {
    try {
      // Create the proposal data structure expected by the backend
      const proposalData = {
        // Client Information
        client: {
          name: formData.clientName,
          email: formData.clientEmail,
          phone: formData.clientPhone,
          company: formData.clientCompany,
          address: formData.clientAddress,
        },
        
        // Selected Hub Centres
        hubCentres: formData.selectedHubCentres,
        
        // Offer Details
        offerDetails: {
          moveInDate: formData.moveInDate,
          lockIn: formData.lockIn,
          noticePeriod: formData.noticePeriod,
          advanceRent: formData.advanceRent,
          standardPricePrivateCabin: formData.standardPricePrivateCabin,
          standardPriceOpenDedicatedDesk: formData.standardPriceOpenDedicatedDesk,
          noRegretOfferedPriceOpenDesk: formData.noRegretOfferedPriceOpenDesk,
          offeredPrintingCredits: formData.offeredPrintingCredits,
          parking2Wheeler: formData.parking2Wheeler,
          parking4Wheeler: formData.parking4Wheeler,
          offeredConferenceRoomCredits: formData.offeredConferenceRoomCredits,
          additionalConferenceRoomCharges: formData.additionalConferenceRoomCharges,
        },
        
        // Proposal Details
        proposal: {
          title: formData.proposalTitle,
          description: formData.proposalDescription,
          value: formData.proposalValue,
          currency: formData.currency,
          validUntil: formData.validUntil,
        },
        
        // Services
        services: formData.services,
        
        // Terms & Conditions
        terms: formData.terms,
        notes: formData.notes,
        
        // Metadata
        createdAt: new Date().toISOString(),
        proposalNumber: `PROP-${Date.now()}`, // Generate a temporary proposal number
      };

      // Send request to backend to generate PDF
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'}/proposals/generate-pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getToken()}`,
        },
        body: JSON.stringify(proposalData),
      });

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      return await response.blob();
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw new Error('Failed to generate PDF from form data');
    }
  }

  /**
   * Generate a PDF URL that can be used in an object/embed tag
   */
  async generatePDFUrl(formData: ProposalFormData): Promise<string> {
    try {
      const blob = await this.generatePDFFromFormData(formData);
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error('Error generating PDF URL:', error);
      throw error;
    }
  }

  /**
   * Download PDF directly
   */
  async downloadPDF(formData: ProposalFormData, filename?: string): Promise<void> {
    try {
      const blob = await this.generatePDFFromFormData(formData);
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || `proposal-${Date.now()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the URL object
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      throw error;
    }
  }

  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    
    try {
      const authStore = localStorage.getItem('auth-storage');
      if (authStore) {
        const parsed = JSON.parse(authStore);
        return parsed.state?.token || null;
      }
    } catch (error) {
      console.error('Error getting token:', error);
    }
    
    return null;
  }
}

export const pdfGeneratorService = new PDFGeneratorService();