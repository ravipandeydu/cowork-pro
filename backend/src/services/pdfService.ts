import PDFDocument from 'pdfkit';
import { IProposal } from '../models/Proposal';
import { ILead } from '../models/Lead';
import { ICenter } from '../models/Center';

export const generateProposalPDF = async (proposal: any): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const buffers: Buffer[] = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer);
      });

      // Header
      doc.fontSize(20)
         .fillColor('#2563eb')
         .text('CoWork Proposal Pro', 50, 50);

      doc.fontSize(16)
         .fillColor('#1f2937')
         .text('Coworking Space Proposal', 50, 80);

      // Proposal details
      doc.fontSize(12)
         .fillColor('#6b7280')
         .text(`Proposal #: ${proposal.proposalNumber}`, 50, 110)
         .text(`Date: ${new Date(proposal.createdAt).toLocaleDateString()}`, 50, 125)
         .text(`Valid Until: ${new Date(proposal.expiryDate).toLocaleDateString()}`, 50, 140);

      // Client Information
      doc.fontSize(14)
         .fillColor('#1f2937')
         .text('Client Information', 50, 180);

      const lead = proposal.leadId as ILead;
      doc.fontSize(11)
         .fillColor('#374151')
         .text(`Name: ${lead.name}`, 50, 205)
         .text(`Company: ${lead.company}`, 50, 220)
         .text(`Email: ${lead.email}`, 50, 235)
         .text(`Phone: ${lead.phone}`, 50, 250)
         .text(`Business Type: ${lead.businessType}`, 50, 265)
         .text(`Team Size: ${lead.businessSize}`, 50, 280);

      // Centers Information
      doc.fontSize(14)
         .fillColor('#1f2937')
         .text('Coworking Centers Details', 50, 320);

      let yPos = 345;
      const centers = proposal.centerIds as unknown as ICenter[];
      if (centers && centers.length > 0) {
        centers.forEach((center: ICenter, index: number) => {
          if (index > 0) {
            yPos += 20; // Add extra spacing between centers
          }
          
          doc.fontSize(11)
             .fillColor('#374151')
             .text(`Center ${index + 1}: ${center.name}`, 50, yPos)
             .text(`Address: ${center.address?.street || ''}, ${center.address?.city || ''}, ${center.address?.state || ''} ${center.address?.zipCode || ''}`, 50, yPos + 15);
          
          yPos += 40;
        });
      }

      // Proposal Details
      doc.fontSize(14)
         .fillColor('#1f2937')
         .text('Proposal Details', 50, 445);

      doc.fontSize(11)
         .fillColor('#374151')
         .text(`Title: ${proposal.title}`, 50, 470);

      // Seating Requirements
      let yPosition = 490;
      doc.text('Seating Requirements:', 50, yPosition);
      yPosition += 20;

      if (proposal.selectedSeating?.hotDesks > 0) {
        doc.text(`• Hot Desks: ${proposal.selectedSeating.hotDesks}`, 70, yPosition);
        yPosition += 15;
      }
      if (proposal.selectedSeating?.dedicatedDesks > 0) {
        doc.text(`• Dedicated Desks: ${proposal.selectedSeating.dedicatedDesks}`, 70, yPosition);
        yPosition += 15;
      }
      if (proposal.selectedSeating?.privateCabins > 0) {
        doc.text(`• Private Cabins: ${proposal.selectedSeating.privateCabins}`, 70, yPosition);
        yPosition += 15;
      }
      if (proposal.selectedSeating?.meetingRooms > 0) {
        doc.text(`• Meeting Rooms: ${proposal.selectedSeating.meetingRooms}`, 70, yPosition);
        yPosition += 15;
      }

      // Amenities
      yPosition += 10;
      if (proposal.selectedAmenities && proposal.selectedAmenities.length > 0) {
        doc.text('Included Amenities:', 50, yPosition);
        yPosition += 20;
        proposal.selectedAmenities.forEach((amenity: string) => {
          doc.text(`• ${amenity}`, 70, yPosition);
          yPosition += 15;
        });
      }

      // Pricing Section
      yPosition += 20;
      doc.fontSize(14)
         .fillColor('#1f2937')
         .text('Pricing Details', 50, yPosition);

      yPosition += 25;
      doc.fontSize(11)
         .fillColor('#374151')
         .text(`Base Amount: ₹${proposal.pricing.baseAmount.toLocaleString()}`, 50, yPosition);

      yPosition += 15;
      if (proposal.pricing.discountPercentage > 0) {
        doc.text(`Discount (${proposal.pricing.discountPercentage}%): -₹${proposal.pricing.discountAmount.toLocaleString()}`, 50, yPosition);
        yPosition += 15;
      }

      doc.fontSize(12)
         .fillColor('#059669')
         .text(`Final Amount: ₹${proposal.pricing.finalAmount.toLocaleString()} (${proposal.pricing.duration})`, 50, yPosition);

      yPosition += 15;
      doc.fontSize(11)
         .fillColor('#374151')
         .text(`Contract Duration: ${proposal.contractDuration}`, 50, yPosition);

      // Terms and Conditions
      yPosition += 40;
      if (proposal.terms && proposal.terms.length > 0) {
        doc.fontSize(14)
           .fillColor('#1f2937')
           .text('Terms & Conditions', 50, yPosition);

        yPosition += 25;
        doc.fontSize(10)
           .fillColor('#374151');

        proposal.terms.forEach((term: string, index: number) => {
          doc.text(`${index + 1}. ${term}`, 50, yPosition);
          yPosition += 20;
        });
      }

      // Footer
      const pageHeight = doc.page.height;
      doc.fontSize(10)
         .fillColor('#6b7280')
         .text('Thank you for considering our coworking space!', 50, pageHeight - 100)
         .text('For any questions, please contact us at the above details.', 50, pageHeight - 85)
         .text('This proposal is valid until the expiry date mentioned above.', 50, pageHeight - 70);

      // Contact Information
      const creator = proposal.createdBy as unknown as { name: string; email: string };
      doc.fontSize(8)
         .fillColor('#9ca3af')
         .text(`Generated by: ${creator.name} (${creator.email})`, 50, pageHeight - 40)
         .text(`Generated on: ${new Date().toLocaleString()}`, 50, pageHeight - 25);

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

export const generateProposalSummaryPDF = async (proposals: any[]): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const buffers: Buffer[] = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer);
      });

      // Header
      doc.fontSize(20)
         .fillColor('#2563eb')
         .text('CoWork Proposal Pro', 50, 50);

      doc.fontSize(16)
         .fillColor('#1f2937')
         .text('Proposals Summary Report', 50, 80);

      doc.fontSize(12)
         .fillColor('#6b7280')
         .text(`Generated on: ${new Date().toLocaleString()}`, 50, 110)
         .text(`Total Proposals: ${proposals.length}`, 50, 125);

      let yPosition = 160;

      proposals.forEach((proposal, index) => {
        if (yPosition > 700) {
          doc.addPage();
          yPosition = 50;
        }

        doc.fontSize(12)
           .fillColor('#1f2937')
           .text(`${index + 1}. ${proposal.proposalNumber}`, 50, yPosition);

        yPosition += 20;
        doc.fontSize(10)
           .fillColor('#374151')
           .text(`Client: ${proposal.leadId.name} (${proposal.leadId.company})`, 70, yPosition)
           .text(`Centers: ${proposal.centers.map((c: any) => c.name).join(', ')}`, 70, yPosition + 12)
           .text(`Amount: ₹${proposal.pricing.finalAmount.toLocaleString()}`, 70, yPosition + 24)
           .text(`Status: ${proposal.status.toUpperCase()}`, 70, yPosition + 36)
           .text(`Created: ${new Date(proposal.createdAt).toLocaleDateString()}`, 70, yPosition + 48);

        yPosition += 80;
      });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};