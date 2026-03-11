import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 10,
  },
  title: {
    fontSize: 14,
    marginBottom: 24,
    fontWeight: "bold",
    textAlign: "center",
  },
  section: {
    marginBottom: 16,
  },
  label: {
    fontSize: 9,
    color: "#333",
    marginBottom: 4,
    fontWeight: "bold",
  },
  value: {
    fontSize: 10,
    marginBottom: 2,
  },
  legalMention: {
    fontSize: 8,
    marginTop: 32,
    fontStyle: "italic",
    color: "#444",
    lineHeight: 1.4,
  },
  signatureBlock: {
    marginTop: 40,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#ccc",
    fontSize: 9,
    color: "#666",
  },
});

export type TaxReceiptDocumentProps = {
  associationName: string;
  associationAddress: string;
  donorName: string;
  donorAddress: string;
  amountEur: number;
  amountLetters: string;
  paymentDate: string;
  receiptNumber: string;
};

export function TaxReceiptDocument({
  associationName,
  associationAddress,
  donorName,
  donorAddress,
  amountEur,
  amountLetters,
  paymentDate,
  receiptNumber,
}: TaxReceiptDocumentProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>
          Reçu au titre des dons - Article 200 du code général des impôts
        </Text>

        <View style={styles.section}>
          <Text style={styles.label}>Association :</Text>
          <Text style={styles.value}>{associationName}</Text>
          <Text style={styles.value}>{associationAddress}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Donateur :</Text>
          <Text style={styles.value}>{donorName}</Text>
          <Text style={styles.value}>{donorAddress}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Montant reçu :</Text>
          <Text style={styles.value}>
            {amountEur} EUR ({amountLetters})
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Date du versement :</Text>
          <Text style={styles.value}>{paymentDate}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Numéro du reçu :</Text>
          <Text style={styles.value}>{receiptNumber}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Nature du don :</Text>
          <Text style={styles.value}>Don en numéraire</Text>
        </View>

        <Text style={styles.legalMention}>
          L&apos;association déclare avoir reçu le montant indiqué et atteste
          que les dispositions de l&apos;article 200 du code général des impôts
          ouvrent droit à réduction d&apos;impôt.
        </Text>

        <View style={styles.signatureBlock}>
          <Text>Fait à _______________, le {paymentDate}</Text>
          <Text style={{ marginTop: 24 }}>
            Signature du responsable habilité
          </Text>
        </View>
      </Page>
    </Document>
  );
}
