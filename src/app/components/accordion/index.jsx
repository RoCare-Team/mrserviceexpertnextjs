import React, { useState } from 'react';

const Accordion = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleAccordion = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const accordionData = [
    {
      title: "How often should I get my RO water purifier serviced in Delhi?",
      content:
        "As per the RO experts, the RO water purifier is serviced at least once or twice every year to lessen premature breakdowns in Delhi. Get in touch with one of the top-rated RO water purifier services in Delhi and get the lowest cost service. You can book fill the form on RO Care India website to book RO Service in Delhi.",
    },
    {
      title: "What does the regular water purifier service cost in Delhi?",
      content:
        "An RO water purifiers maintenance cost depends on the water purifier model and the cost of replacing the RO membrane, pre-filters and post-filters, and the labor cost. The regular water purifier service cost can be lowered with periodic maintenance.",
    },
    {
      title: "When should you schedule a water purifier service in Delhi?",
      content:
        "Any models of water purifiers need to be serviced every 6 to 12 months. Ignoring beyond 12 months can cause filter damage and stops functioning properly. The water purifier manufacturing companies mentioned the standard service period. But its great to be careful about its preventive management and services at an appropriate time by the expert professional.",
    },
    {
      title: "Which water purifier has the lowest service cost in Delhi?",
      content:
        "The adequately maintained water purifier has the minimum service cost because its spares are regularly serviced in Delhi. You can also find some low-maintenance water purifiers that are considered low-maintenance cost systems. One can also try RO AMC to lower the periodic RO service cost and extend its longevity in Delhi.",
    },
    {
      title: "How do I know my water purifier is out of service in Delhi?",
      content:
        "Once your water purifier worked few years, it lowering its capacity to purify water and needs more frequent service in Delhi. There is some presentation that gives you an indication about its service requirements. Frequent breakdowns, water leakage, water impurity, and some other indications indicate its urgent maintenance in Delhi.",
    },
  ];

  return (
    <div className="accordionContainer common-spacing">
      <h1 className="text-center text-purple-800 mb-3">Frequently Asked Questions</h1>
      {accordionData.map((item, index) => (
        <div className="accordionItem" key={index}>
          <h2 className="accordionTitle " onClick={() => toggleAccordion(index)}>
            {item.title}
            <span className="accordion-icon">
              {openIndex === index ? "-" : "+"}
            </span>
          </h2>
          {openIndex === index && (
            <div className="accordionContent">
              <p>{item.content}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default Accordion;