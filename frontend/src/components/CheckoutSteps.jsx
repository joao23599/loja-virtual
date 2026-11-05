import { CardIcon, CartIcon, CheckIcon, TruckIcon } from "./icons";

const STEPS = [
  { id: "cart", label: "Carrinho", Icon: CartIcon },
  { id: "delivery", label: "Entrega", Icon: TruckIcon },
  { id: "payment", label: "Pagamento", Icon: CardIcon },
  { id: "confirmation", label: "Confirmação", Icon: CheckIcon },
];

export default function CheckoutSteps({ current }) {
  const currentIndex = STEPS.findIndex((s) => s.id === current);
  return (
    <ol className="steps" aria-label="Etapas da compra">
      {STEPS.map(({ id, label, Icon }, index) => {
        const state = index < currentIndex ? "is-done" : index === currentIndex ? "is-current" : "";
        return (
          <li key={id} className={`steps__item ${state}`} aria-current={index === currentIndex ? "step" : undefined}>
            <Icon />
            <span>{label}</span>
          </li>
        );
      })}
    </ol>
  );
}
