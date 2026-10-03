"use client";

import { LinkButton } from "@/components/LinkButton";
import { Button, Modal } from "@heroui/react";
import { IoIosArrowRoundForward } from "react-icons/io";

type CalendarInfoModalProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
};

/**
 * The "Calendrier musical 2025" information dialog of the home hero. Loaded
 * with next/dynamic the first time it opens, so the home page does not ship
 * the modal for a button that is only shown until mid-January.
 */
export default function CalendarInfoModal({
  isOpen,
  onOpenChange,
}: CalendarInfoModalProps) {
  return (
    <Modal>
      <Modal.Backdrop isOpen={isOpen} onOpenChange={onOpenChange}>
        <Modal.Container size="lg" scroll="inside">
          <Modal.Dialog>
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading className="text-2xl font-bold">
                🎄 Calendrier Musical 2025
              </Modal.Heading>
              <p className="text-muted text-sm font-normal">
                Une reconnaissance pour Le Bon Tempérament
              </p>
            </Modal.Header>
            <Modal.Body>
              <div className="space-y-4 text-sm leading-relaxed">
                <p>
                  <strong>Cadence</strong> est un{" "}
                  <a
                    href="https://cadence-musique.fr/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary font-medium hover:underline"
                  >
                    pôle musical régional
                  </a>{" "}
                  qui œuvre pour le développement et la structuration des
                  pratiques musicales en amateur par le soutien et
                  l&apos;initiative de projets, la formation,
                  l&apos;accompagnement et la mise en réseau des acteurs.
                </p>
                <p>
                  Le Bon Tempérament a la joie d&apos;être mis à l&apos;honneur
                  dans le <strong>Calendrier Musical 2025 de Cadence</strong>,
                  en étant l&apos;ensemble amateur du jour pour le{" "}
                  <strong>24 décembre</strong>.
                </p>
                <p className="text-primary font-medium">
                  Cette reconnaissance couronne en beauté notre saison 2024/2025
                  et témoigne de la qualité et de l&apos;engagement de notre
                  ensemble vocal et instrumental.
                </p>
                <p className="text-muted text-xs italic">
                  Cadence est soutenu par la Direction régionale des affaires
                  culturelles du Grand Est, la Région Grand Est et la
                  Collectivité européenne d&apos;Alsace.
                </p>
              </div>
            </Modal.Body>
            <Modal.Footer>
              <Button
                variant="ghost"
                onPress={() => onOpenChange(false)}
                aria-label="Fermer"
              >
                Fermer
              </Button>
              <LinkButton
                onClick={() => onOpenChange(false)}
                aria-label="Ouvrir le calendrier musical"
                variant="primary"
                href="https://view.genially.com/6915ed221c1347062848697b/presentation-calendrier-musical-2025-cadence"
                target="_blank"
                rel="noopener noreferrer"
              >
                Ouvrir le calendrier
                <IoIosArrowRoundForward className="ml-2" />
              </LinkButton>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
