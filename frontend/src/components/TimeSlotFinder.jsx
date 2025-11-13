const handleFinalizeBooking = async (paymentMethod) => {
    // --- VALIDACIÓN CORREGIDA (EMAIL OPCIONAL) ---
    // 1. Validar solo nombre y teléfono
    if (!userName || !userPhone) {
      setBookingError('El nombre y el teléfono son obligatorios.');
      return;
    }
    // --- FIN DE LA CORRECCIÓN ---

    if (!selectedCourt || !selectedTimeRange) {
      setBookingError('Por favor, selecciona una cancha y un horario válidos.');
      return;
    }
    setBookingError('');
    setIsBooking(true);

    const { start, end } = selectedTimeRange;
    
    // El objeto bookingData ahora envía el email o un string vacío.
    const bookingData = {
      courtId: selectedCourt.id,
      user: { name: userName, phone: userPhone, email: userEmail || '' },
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      paymentMethod,
      isPaid: paymentMethod !== 'Efectivo',
      totalPrice: selectedCourt.price
    };

    try {
      if (paymentMethod === 'Mercado Pago') {
        
        // --- LÓGICA DE EMAIL PARA MERCADO PAGO ---
        const paymentData = {
          items: [{
            title: `Reserva ${selectedCourt.name} - ${format(start, 'dd/MM HH:mm')}`,
            unit_price: selectedCourt.price,
            quantity: 1,
          }],
          // Si el email está vacío, usa uno genérico. Si existe, usa el del cliente.
          payer: { name: userName, email: userEmail || "test_user@test.com" }, 
          metadata: { booking_id: "PENDING", booking_data: bookingData }
        };
        // --- FIN DE LA LÓGICA ---

        const preference = await paymentService.createPaymentPreference(paymentData);
        window.location.href = preference.init_point;
      
      } else {
        // Pago en Efectivo (ya no necesita el email)
        await bookingService.createBooking(bookingData);
        
        const fechaStr = formatSlotLabel(start);
        const diaStr = formatDateHeader(start, true);
        const msg = `¡Nueva reserva (pago en club)!\nCliente: ${userName}\nCancha: ${selectedCourt.name}\nDía: ${diaStr}\nHora: ${fechaStr}`;
        const whatsappLink = `https://wa.me/${ownerNumber}?text=${encodeURIComponent(msg)}`;

        setCashBookingSuccess({
            message: `¡Reserva confirmada para ${diaStr} a las ${fechaStr}!`,
            whatsappLink: whatsappLink
        });
        
        fetchSlots(); 
        
        // Reseteamos el formulario
        setSelectedSlots([]);
        setSelectedCourt(null);
        setCourtOptions([]);
        setUserName('');
        setUserPhone('');
        setUserEmail(''); // Se resetea
      }
    } catch (err) {
      setBookingError(err.response?.data?.message || 'Ocurrió un error al crear la reserva.');
    } finally {
      setIsBooking(false);
    }
  };
